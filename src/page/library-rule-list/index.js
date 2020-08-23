import React, {useState, useCallback, useEffect} from 'react'
import {Button, DatePicker, version, Layout, Menu, Modal, Input, message} from 'antd'
import {MailOutlined, AppstoreOutlined, SettingOutlined} from '@ant-design/icons'
import {useMount, usePersistFn, useUpdateEffect} from 'ahooks'
import styles from './index.module.less'
import storage from '../../storage/index'
import plug from '../../util/plug'
import {compose} from 'recompose'

import {List, Typography, Divider, Space, Form, Checkbox, Select} from 'antd'
const {Header, Footer, Sider, Content} = Layout
const {SubMenu} = Menu
const {Option} = Select

export default compose(
  plug({
    namespace: 'libraryRuleList',
    state: ['list'],
  })
)(LibraryRuleList)

function LibraryRuleList({effects, state}) {
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

const ModalAdd = plug({
  namespace: 'libraryRuleList',
  state: ['list'],
})(function ModalAdd({effects, visible, setVisible, editItem, editItemIndex}) {
  const [url, setUrl] = useState(editItem?.url || '')
  const [name, setName] = useState(editItem?.name || '')

  console.log('rendering ModalAdd: visible = %s', visible)

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

  const layout = {
    labelCol: {span: 3},
    // wrapperCol: {span: 20},
  }
  const tailLayout = {
    wrapperCol: {offset: 5, span: 16},
  }

  const onFinish = (values) => {
    console.log('Success:', values)
  }

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo)
  }

  const handleChange = () => {}

  const [ruleType, setRuleType] = useState('local')
  console.log('type = %s', ruleType)

  return (
    <Modal
      className={styles.modal}
      title='添加'
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <Form
        {...layout}
        name='basic'
        initialValues={{remember: true}}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
      >
        <Form.Item
          label='类型'
          name='type'
          rules={[{required: true, message: 'Please input your username!'}]}
        >
          <Select
            defaultValue={ruleType}
            value={ruleType}
            style={{width: '200px'}}
            onChange={setRuleType}
          >
            <Option value='local'>本地存储</Option>
            <Option value='remote'>远程规则列表</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label='名称'
          name='name'
          rules={[{required: true, message: 'Please input your username!'}]}
        >
          <Input
            className='input-row'
            value={name}
            onChange={onNameChange}
            onPressEnter={handleOk}
            style={{width: '200px'}}
          />
        </Form.Item>

        <Form.Item
          label='URL'
          name='url'
          rules={[{required: true, message: 'Please input your username!'}]}
        >
          <Input.TextArea
            className='input-row'
            value={url}
            onChange={onUrlChange}
            onPressEnter={handleOk}
            autoSize={{minRows: 3, maxRows: 10}}
          ></Input.TextArea>
        </Form.Item>

        <Form.Item {...tailLayout}>
          <Button type='primary' htmlType='submit'>
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  )
})
