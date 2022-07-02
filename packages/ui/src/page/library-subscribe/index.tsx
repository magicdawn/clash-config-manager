import React, { useState, useCallback } from 'react'
import { Button, Modal, Input, message, List, Space, Select, Divider, Tag, Tooltip } from 'antd'
import { useMemoizedFn, useUpdateEffect } from 'ahooks'
import { v4 as uuid } from 'uuid'
import { useEasy } from '@ui/store'
import styles from './index.module.less'
import { Subscribe } from '@ui/common/define'

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
      title: '确认删除?',
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

      <ModalAdd {...{ visible: showModal, setVisible: setShowModal, editItem, editItemIndex }} />

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
        renderItem={(item: Subscribe, index) => {
          const { url, name, excludeKeywords } = item
          return (
            <List.Item style={{ display: 'flex' }}>
              <div className='list-item'>
                <div className='name'>{name}</div>
                <div className='url'>{url}</div>
                {excludeKeywords?.length && (
                  <div className='exclude'>
                    排除关键词:{' '}
                    {excludeKeywords.map((s) => (
                      <Tag key={s} color='warning'>
                        {s}
                      </Tag>
                    ))}
                  </div>
                )}
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

function ModalAdd({
  visible,
  setVisible,
  editItem,
  editItemIndex,
}: {
  visible: boolean
  setVisible: (visible: boolean) => void
  editItem?: Subscribe
  editItemIndex?: number
}) {
  const subscribeModel = useEasy('librarySubscribe')
  const [url, setUrl] = useState(editItem?.url || '')
  const [name, setName] = useState(editItem?.name || '')
  const [id, setId] = useState(editItem?.id || uuid())
  const [excludeKeywords, setExcludeKeywords] = useState(editItem?.excludeKeywords || [])

  const onUrlChange = useCallback((e) => {
    setUrl(e.target.value)
  }, [])
  const onNameChange = useCallback((e) => {
    setName(e.target.value)
  }, [])

  const onExcludeKeywordsChange = useCallback((value: string[] = []) => {
    console.log('onExcludeKeywordsChange', value)
    setExcludeKeywords(value)
  }, [])

  useUpdateEffect(() => {
    setUrl(editItem?.url || '')
    setName(editItem?.name || '')
    setId(editItem?.id || uuid())
    setExcludeKeywords(editItem?.excludeKeywords || [])
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
      subscribeModel.add({ url, name, id, excludeKeywords })
    } else {
      subscribeModel.edit({ url, name, id, excludeKeywords, editItemIndex })
    }

    setVisible(false)
    clean()
  })

  return (
    <Modal
      className={styles.modal}
      bodyStyle={{ paddingTop: 10 }}
      title='添加'
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      centered
    >
      <Divider orientation='left'>基础设置</Divider>
      <Input
        className='input-row'
        value={name}
        onChange={onNameChange}
        onPressEnter={handleOk}
        prefix={<label className='label'>名称:</label>}
      />

      <Input
        className='input-row'
        value={url}
        onChange={onUrlChange}
        onPressEnter={handleOk}
        prefix={<label className='label'>订阅链接:</label>}
      />

      <Divider orientation='left'>
        <Tooltip
          title={
            <p>
              订阅中的服务器名称如果包含以下任意一个关键词, 则该服务器不会包含在订阅中
              <br />
              <br />
              举例如果有高倍率(x3 / x4 / ...)节点, 不想使用, 设置关键词 <Tag>x3</Tag> <Tag>x4</Tag>{' '}
              即可忽略这些节点
            </p>
          }
        >
          根据关键词排除服务器:
        </Tooltip>
      </Divider>
      <Select
        mode='tags'
        style={{ width: '100%' }}
        placeholder='关键词'
        value={excludeKeywords}
        onChange={onExcludeKeywordsChange}
      ></Select>
    </Modal>
  )
}
