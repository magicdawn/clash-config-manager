import React, {useState, useCallback, useEffect} from 'react'
import {
  Button,
  DatePicker,
  version,
  Layout,
  Menu,
  Modal,
  Input,
  message,
  Space,
  Row,
  Col,
  Card,
} from 'antd'
import {SettingFilled, CloudUploadOutlined, CloudDownloadOutlined} from '@ant-design/icons'
import {useMount, usePersistFn, useUpdateEffect} from 'ahooks'
import usePlug from '@x/rematch/usePlug'
import {useModifyState} from '@x/react/hooks'
import {v4 as uuid} from 'uuid'

import styles from './index.module.less'
import storage from '../../storage/index'
import {compose} from 'recompose'
import helper from '../../util/sync/webdav/helper'

const {Header, Footer, Sider, Content} = Layout
const {SubMenu} = Menu
import {List, Typography, Divider} from 'antd'

const nsp = 'preference'
const stateKeys = ['list']

export default function Preference() {
  const {state, effects} = usePlug({nsp, state: stateKeys})

  useMount(() => {
    effects.init()
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

  return (
    <div className={styles.page}>
      <ModalSyncConfig {...{visible: showModal, setVisible: setShowModal}} />

      <Row>
        <Col span={4} offset={20}>
          <Button
            type='primary'
            block
            onClick={() => {
              setShowModal(true)
            }}
          >
            <SettingFilled />
            配置同步参数
          </Button>
        </Col>
      </Row>

      <Row gutter={{xs: 8, sm: 16, md: 24}} style={{marginTop: 10}}>
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

              <Button type='primary' size='large' danger block onClick={onForceUpload}>
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
            <Button type='primary' block onClick={onDownload}>
              <CloudDownloadOutlined />
              下载
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

function ModalSyncConfig({visible, setVisible, editItem, editItemIndex}) {
  const {state, effects} = usePlug({nsp, state: ['syncConfig']})
  const [data, modifyData] = useModifyState(state.syncConfig)

  useUpdateEffect(() => {
    if (visible) {
      modifyData(state.syncConfig)
    }
  }, [visible])

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
    effects.setState({syncConfig: data})
    effects.persist()

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
