import React, {useState, useCallback, useEffect} from 'react'
import {Button, DatePicker, version, Layout, Menu, Modal, Input, message, Space} from 'antd'
import {MailOutlined, AppstoreOutlined, SettingOutlined} from '@ant-design/icons'
import {useMount, usePersistFn, useUpdateEffect} from 'ahooks'
import usePlug from '@x/rematch/usePlug'
import {useModifyState} from '@x/react/hooks'
import {v4 as uuid} from 'uuid'

import styles from './index.module.less'
import storage from '../../storage/index'
import {compose} from 'recompose'
import {getClient, upload, download} from '../../util/sync/webdav/index.js'

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
    await upload()
  })
  const onDownload = usePersistFn(async () => {
    await download()
  })

  return (
    <div className={styles.page}>
      <ModalSyncConfig {...{visible: showModal, setVisible: setShowModal}} />

      <Space direction='vertical'>
        <Button
          type='primary'
          block
          onClick={() => {
            setShowModal(true)
          }}
        >
          config
        </Button>

        <Button type='primary' block onClick={onUpload}>
          上传
        </Button>

        <Button type='primary' block onClick={onDownload}>
          下载
        </Button>
      </Space>
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
