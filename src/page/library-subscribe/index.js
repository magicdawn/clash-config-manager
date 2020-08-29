import React, {useState, useCallback, useEffect} from 'react'
import {Button, DatePicker, version, Layout, Menu, Modal, Input, message} from 'antd'
import {MailOutlined, AppstoreOutlined, SettingOutlined} from '@ant-design/icons'
import {useMount, usePersistFn, useUpdateEffect} from 'ahooks'
import usePlug from '@x/rematch/usePlug'

import styles from './index.module.less'
import storage from '../../storage/index'
import {compose} from 'recompose'

const {Header, Footer, Sider, Content} = Layout
const {SubMenu} = Menu
import {List, Typography, Divider, Space} from 'antd'

const nsp = 'librarySubscribe'
const stateKeys = ['list']

export default function LibrarySubscribe() {
  const {state, effects} = usePlug({nsp, state: stateKeys})

  useMount(() => {
    effects.init()
  })

  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [editItemIndex, setEditItemIndex] = useState(null)

  const add = usePersistFn(() => {
    console.log('add')
    setEditItem(null)
    setEditItemIndex(null)
    setShowModal(true)
  })

  const edit = usePersistFn((item, index) => {
    setEditItem(item)
    setEditItemIndex(index)
    setShowModal(true)
  })

  const update = usePersistFn((item, index) => {
    effects.update({item, index})
  })

  const disableEnterAsClick = useCallback((e) => {
    // disable enter
    if (e.keyCode === 13) {
      e.preventDefault()
    }
  }, [])

  const del = usePersistFn((item, index) => {
    Modal.confirm({
      title: 'Do you Want to delete these items?',
      content: 'Some descriptions',
      onOk() {
        effects.del(index)
      },
      onCancel() {
        console.log('Cancel')
      },
    })
  })

  return (
    <div className={styles.page}>
      <h1>订阅管理</h1>

      <ModalAdd
        {...{visible: showModal, setVisible: setShowModal, editItem, editItemIndex}}
      ></ModalAdd>

      <List
        size='large'
        header={
          <div className='header'>
            <h4>订阅管理</h4>
            <Button type='primary' onClick={add}>
              +
            </Button>
          </div>
        }
        bordered
        dataSource={state.list}
        renderItem={(item, index) => {
          const {url, name} = item
          return (
            <List.Item style={{display: 'flex'}}>
              <div className='list-item'>
                <div className='name'>{name}</div>
                <div className='url'>{url}</div>
              </div>

              <Space style={{alignSelf: 'flex-end'}}>
                <Button
                  type='primary'
                  onClick={(e) => edit(item, index)}
                  onKeyDown={disableEnterAsClick}
                >
                  编辑
                </Button>
                <Button
                  type='primary'
                  onClick={() => update(item, index)}
                  onKeyDown={disableEnterAsClick}
                >
                  更新
                </Button>
                <Button
                  type='danger'
                  onClick={() => del(item, index)}
                  onKeyDown={disableEnterAsClick}
                >
                  删除
                </Button>
              </Space>
            </List.Item>
          )
        }}
      />
    </div>
  )
}

function ModalAdd({visible, setVisible, editItem, editItemIndex}) {
  const {state, effects} = usePlug({nsp, state: stateKeys})
  const [url, setUrl] = useState(editItem?.url || '')
  const [name, setName] = useState(editItem?.name || '')

  const onUrlChange = useCallback((e) => {
    setUrl(e.target.value)
  }, [])
  const onNameChange = useCallback((e) => {
    setName(e.target.value)
  }, [])

  useUpdateEffect(() => {
    setUrl(editItem?.url || '')
    setName(editItem?.name || '')
  }, [editItem, visible])

  const clean = () => {
    setUrl('')
    setName('')
  }

  const handleCancel = useCallback(() => {
    setVisible(false)
    clean()
  }, [])

  const handleOk = usePersistFn((e) => {
    e?.preventDefault()
    e?.stopPropagation()

    if (!url || !name) {
      return message.warn('url & name 不能为空')
    }

    const err = effects.check({url, name, editItemIndex})
    if (err) {
      return message.error(err)
    }

    const mode = editItem ? 'edit' : 'add'
    if (mode === 'add') {
      effects.add({url, name})
    } else {
      effects.edit({url, name, editItemIndex})
    }

    setVisible(false)
    clean()
  })

  return (
    <Modal
      className={styles.modal}
      title='添加'
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <Input
        className='input-row'
        prefix={<label className='label'>name</label>}
        value={name}
        onChange={onNameChange}
        onPressEnter={handleOk}
      />
      <Input
        className='input-row'
        prefix={<label className='label'>URL</label>}
        value={url}
        onChange={onUrlChange}
        onPressEnter={handleOk}
      />
    </Modal>
  )
}
