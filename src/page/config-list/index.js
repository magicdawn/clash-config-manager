import React, {useState, useCallback, useEffect, useRef} from 'react'
import {Button, DatePicker, version, Layout, Menu, Modal, Input, message} from 'antd'
import {MailOutlined, AppstoreOutlined, SettingOutlined} from '@ant-design/icons'
import {useMount, usePersistFn, useUpdateEffect, useSetState} from 'ahooks'
import {compose} from 'recompose'
import usePlug from '@x/rematch/usePlug'
import {v4 as uuid} from 'uuid'
import {firstLine} from '../../util/text-util'

import styles from './index.module.less'
import storage from '../../storage/index'
import {List, Typography, Divider, Space, Form, Checkbox, Select} from 'antd'
import DndPlaygroud from './DndPlayground'

const {Header, Footer, Sider, Content} = Layout
const {SubMenu} = Menu
const {Option} = Select

const namespace = 'configList'

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
  const [editMode, setEditMode] = useState('edit')

  const add = usePersistFn(() => {
    setEditItem(null)
    setEditItemIndex(null)
    setEditMode('edit')
    setShowModal(true)
  })

  const edit = usePersistFn((item, index) => {
    setEditItem(item)
    setEditItemIndex(index)
    setEditMode('edit')
    setShowModal(true)
  })

  const view = usePersistFn((item, index) => {
    setEditItem(item)
    setEditItemIndex(index)
    setEditMode('readonly')
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
      <h1>配置管理</h1>
      <DndPlaygroud></DndPlaygroud>
    </div>
  )
}

import ConfigEditor from './ConfigEditor'

function ModalAdd({visible, setVisible, editItem, editItemIndex, editMode}) {
  const {state, effects} = usePlug({nsp: namespace, state: ['list']})

  const readonly = editMode === 'readonly'

  const defaultItem = {
    type: 'local',
    name: '',
    url: '',
    content: '',
  }

  const [form] = Form.useForm()
  const configEditorRef = useRef(null)

  useUpdateEffect(() => {
    const val = editItem || defaultItem
    form.setFieldsValue(val)

    if (visible) {
      configEditorRef.current?.setSelections([])
      configEditorRef.current?.focus()
    }
  }, [editItem, visible])

  const clean = () => {
    form.resetFields()
  }

  const layout = {
    labelCol: {span: 4},
    wrapperCol: {span: 20},
  }
  const tailLayout = {
    wrapperCol: {offset: 5, span: 16},
  }

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

  const handleSubmit = usePersistFn((item) => {
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
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
      >
        <Form.Item label='类型' name='type' rules={[{required: true, message: '类型不能为空'}]}>
          <Select style={{width: '200px'}} disabled={readonly}>
            <Option value='local'>本地存储</Option>
            <Option value='remote'>远程规则列表</Option>
          </Select>
        </Form.Item>

        <Form.Item label='名称' name='name' rules={[{required: true, message: '名称不能为空'}]}>
          <Input
            className='input-row'
            onPressEnter={onInputPressEnter}
            style={{width: '200px'}}
            disabled={readonly}
          />
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
        >
          {({getFieldValue}) =>
            getFieldValue('type') === 'local' ? (
              <Form.Item
                label='content'
                name='content'
                rules={[{required: true, message: '内容不能为空'}]}
              >
                <ConfigEditor ref={configEditorRef} readonly={readonly} />
              </Form.Item>
            ) : (
              <Form.Item label='URL' name='url' rules={[{required: true, message: 'url不能为空'}]}>
                <Input.TextArea
                  className='input-row'
                  onPressEnter={onInputPressEnter}
                  autoSize={{minRows: 3, maxRows: 10}}
                  disabled={readonly}
                ></Input.TextArea>
              </Form.Item>
            )
          }
        </Form.Item>
      </Form>
    </Modal>
  )
}
