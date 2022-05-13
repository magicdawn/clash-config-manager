import React, { useState, useCallback } from 'react'
import { Button, Modal, Input, message, List, Space } from 'antd'
import { useMemoizedFn, useUpdateEffect } from 'ahooks'
import { v4 as uuid } from 'uuid'
import { useEasy } from '@ui/store'
import styles from './index.module.less'

export default function LibrarySubscribe() {
  const subscribeModel = useEasy('librarySubscribe')

  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [editItemIndex, setEditItemIndex] = useState(null)

  const add = useMemoizedFn(() => {
    console.log('add')
    setEditItem(null)
    setEditItemIndex(null)
    setShowModal(true)
  })

  const edit = useMemoizedFn((item, index) => {
    setEditItem(item)
    setEditItemIndex(index)
    setShowModal(true)
  })

  const update = useMemoizedFn((item, index) => {
    subscribeModel.update({ url: item.url })
  })

  const disableEnterAsClick = useCallback((e) => {
    // disable enter
    if (e.keyCode === 13) {
      e.preventDefault()
    }
  }, [])

  const del = useMemoizedFn((item, index) => {
    Modal.confirm({
      title: 'Do you Want to delete these items?',
      content: 'Some descriptions',
      onOk() {
        subscribeModel.del(index)
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
        {...{ visible: showModal, setVisible: setShowModal, editItem, editItemIndex }}
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
        dataSource={subscribeModel.list}
        renderItem={(item, index) => {
          const { url, name } = item
          return (
            <List.Item style={{ display: 'flex' }}>
              <div className='list-item'>
                <div className='name'>{name}</div>
                <div className='url'>{url}</div>
              </div>

              <Space style={{ alignSelf: 'flex-end' }}>
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
                <Button danger onClick={() => del(item, index)} onKeyDown={disableEnterAsClick}>
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

function ModalAdd({ visible, setVisible, editItem, editItemIndex }) {
  const subscribeModel = useEasy('librarySubscribe')
  const [url, setUrl] = useState(editItem?.url || '')
  const [name, setName] = useState(editItem?.name || '')
  const [id, setId] = useState(editItem?.id || uuid())

  const onUrlChange = useCallback((e) => {
    setUrl(e.target.value)
  }, [])
  const onNameChange = useCallback((e) => {
    setName(e.target.value)
  }, [])

  useUpdateEffect(() => {
    setUrl(editItem?.url || '')
    setName(editItem?.name || '')
    setId(editItem?.id || uuid())
  }, [editItem, visible])

  const clean = () => {
    setUrl('')
    setName('')
    setId('')
  }

  const handleCancel = useCallback(() => {
    setVisible(false)
    clean()
  }, [])

  const handleOk = useMemoizedFn((e) => {
    e?.preventDefault()
    e?.stopPropagation()

    if (!url || !name) {
      return message.warn('url & name 不能为空')
    }

    const err = subscribeModel.check({ url, name, editItemIndex })
    if (err) {
      return message.error(err)
    }

    const mode = editItem ? 'edit' : 'add'
    if (mode === 'add') {
      subscribeModel.add({ url, name, id })
    } else {
      subscribeModel.edit({ url, name, id, editItemIndex })
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
      centered
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
