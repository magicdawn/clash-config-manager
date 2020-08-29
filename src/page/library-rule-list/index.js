import React, {useState, useCallback, useEffect, useRef} from 'react'
import {Button, DatePicker, version, Layout, Menu, Modal, Input, message} from 'antd'
import {MailOutlined, AppstoreOutlined, SettingOutlined} from '@ant-design/icons'
import {useMount, usePersistFn, useUpdateEffect, useSetState} from 'ahooks'
import {compose} from 'recompose'
import usePlug from '@x/rematch/usePlug'
import {v4 as uuid} from 'uuid'

import styles from './index.module.less'
import storage from '../../storage/index'
import {List, Typography, Divider, Space, Form, Checkbox, Select} from 'antd'
const {Header, Footer, Sider, Content} = Layout
const {SubMenu} = Menu
const {Option} = Select

const namespace = 'libraryRuleList'

export default function LibraryRuleList(props) {
  const {effects, state, setState} = usePlug({
    nsp: namespace,
    state: ['list'],
  })

  useMount(() => {
    effects.init()
  })

  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [editItemIndex, setEditItemIndex] = useState(null)

  const add = usePersistFn(() => {
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
      <h1>规则列表管理</h1>

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

import ConfigEditor from './ConfigEditor'

function ModalAdd({visible, setVisible, editItem, editItemIndex}) {
  const {state, effects} = usePlug({nsp: namespace, state: ['list']})

  const defaultItem = {
    type: 'local',
    name: '',
    url: '',
    content: '',
  }

  const [item, setItem] = useSetState(editItem || {...defaultItem})
  useUpdateEffect(() => {
    setItem(editItem || defaultItem)
  }, [editItem, visible])

  const onUrlChange = useCallback((e) => {
    setItem({url: e.target.value})
  }, [])
  const onNameChange = useCallback((e) => {
    setItem({name: e.target.value})
  }, [])

  const clean = () => {
    setItem(defaultItem)
  }

  const layout = {
    labelCol: {span: 4},
    wrapperCol: {span: 20},
  }
  const tailLayout = {
    wrapperCol: {offset: 5, span: 16},
  }

  const configEditorRef = useRef(null)

  useUpdateEffect(() => {
    configEditorRef.current?.focus()
  }, [visible])

  const [form] = Form.useForm()

  const handleCancel = useCallback(() => {
    setVisible(false)
    clean()
  }, [])

  const handleOk = usePersistFn((e) => {
    e?.preventDefault()
    e?.stopPropagation()
    form.submit()
  })

  const onInputPressEnter = usePersistFn((e) => {
    e?.preventDefault()
    e?.stopPropagation()
    form.submit()
  })

  const handleSubmit = usePersistFn(() => {
    const {type, name, url, content} = item

    if (type === 'local' && !content) {
      return message.error('content can not be empty')
    }

    const err = effects.check({item, editItemIndex})
    if (err) return message.error(err)

    const mode = editItem ? 'edit' : 'add'
    if (mode === 'add') {
      effects.add({item})
    } else {
      effects.edit({item, editItemIndex})
    }

    setVisible(false)
    clean()
  })

  const onFinish = (values) => {
    handleSubmit(values)
  }
  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo)
  }

  return (
    <Modal
      className={styles.modal}
      title='添加'
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={'90vw'}
    >
      <Form
        {...layout}
        form={form}
        name='basic'
        initialValues={item}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
      >
        <Form.Item
          label='类型'
          name='type'
          rules={[{required: true, message: '类型不能为空'}]}
          value={item.type}
        >
          <Select
            value={item.type}
            style={{width: '200px'}}
            onChange={(val) => setItem({type: val})}
          >
            <Option value='local'>本地存储</Option>
            <Option value='remote'>远程规则列表</Option>
          </Select>
        </Form.Item>

        <Form.Item label='名称' name='name' rules={[{required: true, message: '名称不能为空'}]}>
          <Input
            className='input-row'
            value={item.name}
            onChange={onNameChange}
            onPressEnter={onInputPressEnter}
            style={{width: '200px'}}
          />
        </Form.Item>

        {do {
          if (item.type === 'local') {
            ;<Form.Item label='content' name='content'>
              <>
                <ConfigEditor
                  ref={configEditorRef}
                  id={item.id}
                  value={item.content}
                  onChange={(val) => setItem({content: val})}
                />
              </>
            </Form.Item>
          } else if (item.type === 'remote') {
            ;<Form.Item label='URL' name='url' rules={[{required: true, message: 'url不能为空'}]}>
              <Input.TextArea
                className='input-row'
                value={item.url}
                onChange={onUrlChange}
                onPressEnter={onInputPressEnter}
                autoSize={{minRows: 3, maxRows: 10}}
              ></Input.TextArea>
            </Form.Item>
          }
        }}
      </Form>
    </Modal>
  )
}
