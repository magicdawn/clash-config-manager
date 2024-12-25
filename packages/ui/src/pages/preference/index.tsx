import { appTempDir, getAssetsDir } from '$ui/common'
import storage, { customMerge, getExportData } from '$ui/storage'
import { message, rootActions, rootState } from '$ui/store'
import useImmerState from '$ui/utility/hooks/useImmerState'
import helper, { STORAGE_FILE } from '$ui/utility/sync/webdav/helper'
import { CloudDownloadOutlined, CloudUploadOutlined, SettingFilled } from '@ant-design/icons'
import { useMemoizedFn, useUpdateEffect } from 'ahooks'
import { Alert, Button, Card, Col, Input, Modal, Radio, Row, Space, Tag } from 'antd'
import debugFactory from 'debug'
import { ipcRenderer, shell } from 'electron'
import fse from 'fs-extra'
import launch from 'launch-editor'
import moment from 'moment'
import path from 'path'
import { useCallback, useState } from 'react'
import { useSnapshot } from 'valtio'
import styles from './index.module.less'
import { SelectExportForStaticMethod, pickDataFrom } from './modal/SelectExport'
import { type Theme, state } from './model'

const debug = debugFactory('app:page:preference')

export default function Preference() {
  const [showModal, setShowModal] = useState(false)

  const onUpload = useMemoizedFn(async () => {
    await helper.upload()
  })
  const onForceUpload = useMemoizedFn(async () => {
    await helper.forceUpload()
  })

  const onDownload = useMemoizedFn(async () => {
    await helper.download()
  })
  const onForceDownload = useMemoizedFn(async () => {
    await helper.forceDownload()
  })

  const [exportSuccessModalVisible, setExportSuccessModalVisible] = useState(false)
  const [exportSuccessFile, setExportSuccessFile] = useState('')

  const onExport = useMemoizedFn(async () => {
    const file = path.join(
      appTempDir,
      `clash-config-manager ${moment().format('YYYY-MM-DD HH.mm')}.json`,
    )
    const data = getExportData()
    await fse.outputJson(file, data, { spaces: 2 })
    setExportSuccessModalVisible(true)
    setExportSuccessFile(file)
  })

  const onSelectExport = useMemoizedFn(async () => {
    const file = path.join(appTempDir, `${moment().format('选择导出__YYYY_MM_DD__HH_mm')}.json`)

    // 选择数据
    const { cancel, data } = await pickDataFrom(getExportData())
    if (cancel) return
    console.log(data)

    await fse.outputJson(file, data, { spaces: 2 })
    setExportSuccessModalVisible(true)
    setExportSuccessFile(file)
  })

  const importAction = async (importData: any) => {
    // 选择数据
    const { cancel, data: selectedData } = await pickDataFrom(importData)
    debug(
      'importAction: %O, select result: cancel = %s, selectedData = %O',
      importData,
      cancel,
      selectedData,
    )
    if (cancel || !selectedData) return

    const localData = { ...storage.store }
    const merged = customMerge(localData, selectedData)
    debug('importAction customMerge %O', { localData, importData, selectedData, merged })

    // reload electron-store
    storage.store = merged

    // reload react store
    rootActions.global.reload()

    message.success('导入成功: 已与本地配置合并')
  }

  const importFile = async (file: string) => {
    let importData: any
    try {
      importData = await fse.readJson(file)
    } catch (e) {
      console.log(e.stack || e)
      return message.error('readJson fail: ' + '\n' + e.stack || e)
    }
    importAction(importData)
  }

  const onSelectFileAndImport = useMemoizedFn(async () => {
    const file = await ipcRenderer.invoke('select-file')
    if (!file) return
    await importFile(file)
  })

  const onImportBundledPreset = useMemoizedFn(async () => {
    const presetFile = path.join(await getAssetsDir(), 'json/基本数据规则.json')
    importFile(presetFile)
  })

  const openInEditor = useMemoizedFn((editor) => {
    launch(
      // file
      exportSuccessFile,
      // try specific editor bin first (optional)
      editor,
      (fileName, errorMsg) => {
        message.error(errorMsg)
      },
    )
  })

  const rowGutter = { xs: 8, sm: 16, md: 24 }

  const { theme } = useSnapshot(state)

  return (
    <div className={styles.page}>
      <ModalSyncConfig {...{ visible: showModal, setVisible: setShowModal }} />

      <Modal
        title='已导出'
        open={exportSuccessModalVisible}
        onOk={() => setExportSuccessModalVisible(false)}
        onCancel={() => setExportSuccessModalVisible(false)}
        centered
        maskClosable={false}
        keyboard={true}
      >
        <div style={{ marginBottom: 12 }}>文件位置: {exportSuccessFile}</div>
        <Space>
          <Button
            onClick={() => {
              shell.showItemInFolder(exportSuccessFile)
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

      <Row>
        <Radio.Group
          buttonStyle='solid'
          value={theme || 'light'}
          onChange={(e) => (state.theme = e.target.value)}
        >
          <Radio.Button value={'light' satisfies Theme}>浅色模式</Radio.Button>
          <Radio.Button value={'dark' satisfies Theme}>深色模式</Radio.Button>
          <Radio.Button value={'follow-system' satisfies Theme}>跟随系统</Radio.Button>
        </Radio.Group>

        <Col flex={1}></Col>

        <Button
          type='primary'
          onClick={() => {
            setShowModal(true)
          }}
        >
          <SettingFilled />
          配置同步参数
        </Button>
      </Row>

      <Row gutter={rowGutter} style={{ marginTop: 10 }}>
        {/* 上传区 */}
        <Col span={12}>
          <Card
            title={
              <>
                <CloudUploadOutlined /> 上传
              </>
            }
          >
            <Space direction='vertical' size={20} style={{ width: '100%' }}>
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
            <Space direction='vertical' size={20} style={{ width: '100%' }}>
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

      <Row gutter={rowGutter} style={{ marginTop: 10 }}>
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
            <Space direction='vertical' size={20} style={{ width: '100%' }}>
              <Button block type='primary' onClick={onExport}>
                <CloudUploadOutlined /> 导出全部数据到 JSON
              </Button>
              <Button block onClick={onSelectExport}>
                <CloudUploadOutlined /> 选择导出数据到 JSON
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
            <Space direction='vertical' size={20} style={{ width: '100%' }}>
              <Button type='primary' block onClick={onSelectFileAndImport}>
                <CloudUploadOutlined /> 从 JSON 导入
              </Button>

              <Button block onClick={onImportBundledPreset}>
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
  visible: boolean
  setVisible: (visible: boolean) => void
  editItem?: any
  editItemIndex?: number
}

function ModalSyncConfig(props: ModalSyncConfigProps) {
  const { visible, setVisible } = props

  const syncConfig = useSnapshot(rootState.preference.syncConfig)
  const [data, modifyData] = useImmerState(syncConfig)

  useUpdateEffect(() => {
    if (visible) {
      modifyData(syncConfig)
    }
  }, [visible, syncConfig])

  const handleCancel = useCallback(() => {
    setVisible(false)
  }, [])

  const handleOk = useMemoizedFn((e) => {
    e?.preventDefault()
    e?.stopPropagation()

    console.log(data)
    const { davServerUrl, user, pass } = data

    if (!davServerUrl || !user || !pass) {
      return message.warning('davServerUrl & user & pass 不能为空')
    }

    // save
    rootState.preference.syncConfig = data

    // close
    setVisible(false)
  })

  return (
    <Modal
      width={'80vw'}
      className={styles.modal}
      title='服务器设置'
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <Alert
        type='success'
        message='同步服务'
        description={
          <span>
            <ul style={{ marginBottom: 0, paddingLeft: 25 }}>
              <li>
                支持任意 webdav 协议的同步, 推荐使用坚果云{' '}
                <a href='https://www.jianguoyun.com/' target='_blank' rel='noreferrer'>
                  https://www.jianguoyun.com/
                </a>
              </li>
              <li style={{ lineHeight: 1.5 }}>
                存放在文件 <Tag color='warning'>{STORAGE_FILE}</Tag> 中, 以
                <Tag color='default'>to-base64(to-json(config))</Tag> 形式保存
              </li>
            </ul>
          </span>
        }
      />
      <Input
        className='input-row'
        prefix={<label className='label'>server url</label>}
        value={data.davServerUrl}
        onChange={(e) => modifyData({ davServerUrl: e.target.value })}
        onPressEnter={handleOk}
      />
      <Input
        className='input-row'
        prefix={<label className='label'>user</label>}
        value={data.user}
        onChange={(e) => modifyData({ user: e.target.value })}
        onPressEnter={handleOk}
      />
      <Input
        className='input-row'
        type='password'
        prefix={<label className='label'>password</label>}
        value={data.pass}
        onChange={(e) => modifyData({ pass: e.target.value })}
        onPressEnter={handleOk}
      />
    </Modal>
  )
}
