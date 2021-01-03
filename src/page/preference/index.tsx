import {tmpdir} from 'os'
import moment from 'moment'
import path from 'path'
import fse from 'fs-extra'
import {shell, ipcRenderer} from 'electron'
import launch from 'launch-editor'
import _ from 'lodash'

import React, {useState, useCallback, useEffect} from 'react'
import {Button, Modal, Input, message, Space, Row, Col, Card} from 'antd'
import {SettingFilled, CloudUploadOutlined, CloudDownloadOutlined} from '@ant-design/icons'
import {useMount, usePersistFn, useUpdateEffect} from 'ahooks'
import useImmerState from '@util/hooks/useImmerState'
import storage from '../../storage/index'
import customMerge from '../../util/sync/webdav/customMerge'
import {pick as pickSelectExport, SelectExportForStaticMethod} from './modal/SelectExport'
import PRESET_JSON_DATA from '../../assets/基本数据规则.json'

import styles from './index.module.less'
import helper from '../../util/sync/webdav/helper'
import {useEasy} from '@store'

export default function Preference() {
  const preferenceModel = useEasy('preference')
  const globalModel = useEasy('global')

  useMount(() => {
    preferenceModel.init()
  })

  const [showModal, setShowModal] = useState(false)

  const onUpload = usePersistFn(async () => {
    await helper.upload()
  })
  const onForceUpload = usePersistFn(async () => {
    await helper.forceUpload()
  })

  const onDownload = usePersistFn(async () => {
    await helper.download()
  })
  const onForceDownload = usePersistFn(async () => {
    await helper.forceDownload()
  })

  const [exportHelperVisible, setExportHelperVisible] = useState(false)
  const [exportFile, setExportFile] = useState('')

  const onExport = usePersistFn(async () => {
    const file = path.join(tmpdir(), 'cfm', `${moment().format('YYYY_MM_DD__HH_mm')}.json`)

    let outputData = storage.store
    let data = _.omit(outputData, ['subscribe_detail'])
    await fse.outputJson(file, data, {spaces: 2})
    setExportHelperVisible(true)
    setExportFile(file)
  })

  const onSelectImport = usePersistFn(async () => {
    const file = path.join(
      tmpdir(),
      'cfm',
      `${moment().format('选择导出__YYYY_MM_DD__HH_mm')}.json`
    )
    const fullData = storage.store
    const outputData = _.omit(fullData, ['subscribe_detail'])

    // 选择数据
    const {cancel, data} = await pickSelectExport(outputData)
    if (cancel) return
    console.log(data)

    await fse.outputJson(file, data, {spaces: 2})
    setExportHelperVisible(true)
    setExportFile(file)
  })

  const importAction = (importData) => {
    const localData = {...storage.store}
    const merged = customMerge(localData, importData)
    console.log('customMerge', {localData, importData, merged})

    // reload electron-store
    storage.store = merged

    // reload redux
    globalModel.reload()

    message.success('导入成功: 已与本地配置合并')
  }

  const onImport = usePersistFn(async () => {
    const file = await ipcRenderer.invoke('select-file')
    if (!file) return

    let importData
    try {
      importData = await fse.readJson(file)
    } catch (e) {
      console.log(e.stack || e)
      return message.error('readJson fail: ' + '\n' + e.stack || e)
    }
    importAction(importData)
  })

  const onImportPreset = usePersistFn(async () => {
    importAction(PRESET_JSON_DATA)
  })

  const openInEditor = usePersistFn((editor) => {
    launch(
      // file
      exportFile,
      // try specific editor bin first (optional)
      editor,
      (fileName, errorMsg) => {
        message.error(errorMsg)
      }
    )
  })

  const rowGutter = {xs: 8, sm: 16, md: 24}

  return (
    <div className={styles.page}>
      <ModalSyncConfig {...{visible: showModal, setVisible: setShowModal}} />

      <Modal
        title='已导出'
        visible={exportHelperVisible}
        onOk={() => setExportHelperVisible(false)}
        onCancel={() => setExportHelperVisible(false)}
        centered
        maskClosable={false}
        keyboard={true}
      >
        <div style={{marginBottom: 12}}>文件位置: {exportFile}</div>
        <Space>
          <Button
            onClick={() => {
              shell.showItemInFolder(exportFile)
            }}
          >
            在 Finder 中展示
          </Button>
          <Button
            onClick={() => {
              openInEditor('code')
            }}
          >
            在 vscode 中打开
          </Button>
          <Button
            onClick={() => {
              openInEditor('atom')
            }}
          >
            在 Atom 中打开
          </Button>
        </Space>
      </Modal>

      <div style={{textAlign: 'right'}}>
        <Button
          type='primary'
          onClick={() => {
            setShowModal(true)
          }}
        >
          <SettingFilled />
          配置同步参数
        </Button>
      </div>

      <Row gutter={rowGutter} style={{marginTop: 10}}>
        {/* 上传区 */}
        <Col span={12}>
          <Card
            title={
              <>
                <CloudUploadOutlined /> 上传
              </>
            }
          >
            <Space direction='vertical' size={20} style={{width: '100%'}}>
              <Button type='primary' size='large' block onClick={onUpload}>
                <CloudUploadOutlined />
                上传
              </Button>

              <Button type='primary' danger block onClick={onForceUpload}>
                <CloudUploadOutlined />
                上传 (覆盖远程版本)
              </Button>
            </Space>
          </Card>
        </Col>

        {/* 下载区 */}
        <Col span={12}>
          <Card
            title={
              <>
                <CloudDownloadOutlined /> 下载
              </>
            }
          >
            <Space direction='vertical' size={20} style={{width: '100%'}}>
              <Button type='primary' size='large' block onClick={onDownload}>
                <CloudDownloadOutlined />
                下载
              </Button>
              <Button type='primary' danger block onClick={onForceDownload}>
                <CloudDownloadOutlined />
                下载(覆盖本地版本)
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={rowGutter} style={{marginTop: 10}}>
        {/* 导出区 */}
        <Col span={12}>
          <Card
            title={
              <>
                <CloudUploadOutlined /> 导出
              </>
            }
          >
            <SelectExportForStaticMethod />
            <Space direction='vertical' size={20} style={{width: '100%'}}>
              <Button block type='primary' onClick={onExport}>
                <CloudUploadOutlined /> 导出到 JSON
              </Button>
              <Button block onClick={onSelectImport}>
                <CloudUploadOutlined /> 高级导出
              </Button>
            </Space>
          </Card>
        </Col>

        {/* 导入区 */}
        <Col span={12}>
          <Card
            title={
              <>
                <CloudUploadOutlined /> 导入
              </>
            }
          >
            <Space direction='vertical' size={20} style={{width: '100%'}}>
              <Button type='primary' block onClick={onImport}>
                <CloudUploadOutlined /> 从 JSON 导入
              </Button>

              <Button block onClick={onImportPreset}>
                <CloudUploadOutlined /> 导入应用内置的基本设置
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

interface ModalSyncConfigProps {
  visible
  setVisible
  editItem?
  editItemIndex?
}

function ModalSyncConfig(props: ModalSyncConfigProps) {
  const {visible, setVisible, editItem, editItemIndex} = props
  const preferenceModel = useEasy('preference')

  const [data, modifyData] = useImmerState(preferenceModel.syncConfig)

  useUpdateEffect(() => {
    if (visible) {
      modifyData(preferenceModel.syncConfig)
    }
  }, [visible, preferenceModel.syncConfig])

  const handleCancel = useCallback(() => {
    setVisible(false)
  }, [])

  const handleOk = usePersistFn((e) => {
    e?.preventDefault()
    e?.stopPropagation()

    console.log(data)
    const {davServerUrl, user, pass} = data

    if (!davServerUrl || !user || !pass) {
      return message.warn('davServerUrl & user & pass 不能为空')
    }

    // save
    preferenceModel.setState({syncConfig: data})
    preferenceModel.persist()

    // close
    setVisible(false)
  })

  return (
    <Modal
      width={'80vw'}
      className={styles.modal}
      title='服务器设置'
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <Input
        className='input-row'
        prefix={<label className='label'>server url</label>}
        value={data.davServerUrl}
        onChange={(e) => modifyData({davServerUrl: e.target.value})}
        onPressEnter={handleOk}
      />
      <Input
        className='input-row'
        prefix={<label className='label'>user</label>}
        value={data.user}
        onChange={(e) => modifyData({user: e.target.value})}
        onPressEnter={handleOk}
      />
      <Input
        className='input-row'
        type='password'
        prefix={<label className='label'>password</label>}
        value={data.pass}
        onChange={(e) => modifyData({pass: e.target.value})}
        onPressEnter={handleOk}
      />
    </Modal>
  )
}
