import React, {useState, useCallback, useRef} from 'react'
import {Button, Modal, Input, message, Tooltip} from 'antd'
import {useMount, usePersistFn, useUpdateEffect} from 'ahooks'
import usePlug from '@x/rematch/usePlug'
import {useModifyState} from '@x/react/hooks'
import {v4 as uuid} from 'uuid'
import {firstLine, limitLines} from '../../util/text-util'
import Yaml from 'js-yaml'

import styles from './index.module.less'
import {List, Space, Form, Select} from 'antd'
const {Option} = Select

const namespace = 'libraryRuleList'

export default function LibraryRuleList() {
  const {effects, state} = usePlug({
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

  // const update = usePersistFn((item, index) => {
  //   effects.update({item, index})
  // })

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
      <h1>配置源管理</h1>

      <ModalAdd
        {...{visible: showModal, setVisible: setShowModal, editItem, editItemIndex, editMode}}
      />

      <List
        size='large'
        header={
          <div className='header'>
            <h4>配置源管理</h4>
            <Button type='primary' onClick={add}>
              +
            </Button>
          </div>
        }
        bordered
        dataSource={state.list}
        renderItem={(item, index) => {
          const {type, name, url, content} = item
          return (
            <List.Item style={{display: 'flex'}}>
              <div className='list-item'>
                <div className='name'>名称: {name}</div>
                <div className='type'>类型: {type === 'local' ? '本地' : '远程'}</div>
                <div className='info'>
                  {do {
                    if (type === 'local') {
                      ;<Tooltip
                        title={<div style={{whiteSpace: 'pre'}}>{limitLines(content, 10)}</div>}
                      >
                        <div style={{color: 'blue'}}>内容: {firstLine(content)}</div>
                      </Tooltip>
                    } else {
                      ;<div className='url'>链接: {url}</div>
                    }
                  }}
                </div>
              </div>

              <Space style={{display: 'flex', alignItems: 'center'}}>
                <Button
                  type='primary'
                  onClick={(e) => edit(item, index)}
                  onKeyDown={disableEnterAsClick}
                >
                  编辑
                </Button>

                <Button
                  type='success'
                  onClick={(e) => view(item, index)}
                  onKeyDown={disableEnterAsClick}
                >
                  查看
                </Button>

                {/* not implemented */}
                {/* <div style={{display: 'flex', flexDirection: 'column'}}>
                  <Button
                    type='primary'
                    onClick={(e) => edit(item, index)}
                    onKeyDown={disableEnterAsClick}
                  >
                    编辑规则(可视化)
                  </Button>
                </div> */}

                {/* remote config not supported */}
                {/* <Button
                  type='primary'
                  disabled={type !== 'remote'}
                  onClick={() => update(item, index)}
                  onKeyDown={disableEnterAsClick}
                >
                  更新
                </Button> */}

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
import RuleAddModal from './AddRuleModal'

function ModalAdd({visible, setVisible, editItem, editItemIndex, editMode}) {
  const {effects} = usePlug({nsp: namespace, state: ['list']})

  const readonly = editMode === 'readonly'

  const getDefaultItem = () => ({
    id: uuid(),
    type: 'local',
    name: '',
    url: '',
    content: '',
  })

  const [form] = Form.useForm()
  const [otherFormData, modifyOtherFormData] = useModifyState({})

  const configEditorRef = useRef(null)

  useUpdateEffect(() => {
    let val = editItem || getDefaultItem()

    form.setFieldsValue(val)
    modifyOtherFormData((o) => {
      o.id = val.id
    })

    if (visible) {
      configEditorRef.current?.setSelections([])
      configEditorRef.current?.focus()
    }
  }, [editItem, visible])

  const clean = () => {
    form.resetFields()
  }

  const layout = {
    labelCol: {span: 3},
    wrapperCol: {span: 21},
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
    const {type, content} = item

    // add more data
    const {id} = otherFormData
    item.id = id

    if (type === 'local') {
      if (!content) {
        return message.error('content can not be empty')
      }

      let err
      try {
        Yaml.safeLoad(content)
      } catch (e) {
        err = e
      }
      if (err) {
        return message.error('yaml load fail: ' + err.stack || err.message)
      }
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

  const [ruleAddVisible, setRuleAddVisible] = useState(false)
  const handleAddRuleChrome = useCallback(() => {
    setRuleAddVisible(true)
  }, [])

  return (
    <Modal
      className={styles.modal}
      title='添加'
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={'90vw'}
      centered
      maskClosable={false}
      keyboard={false}
      footer={
        <div className='footer'>
          <RuleAddModal visible={ruleAddVisible} setVisible={setRuleAddVisible} />
          <Button onClick={handleAddRuleChrome}>从 Chrome 添加规则</Button>

          <div className='btn-wrapper'>
            <Button onClick={handleCancel}>取消</Button>
            <Button type='primary' onClick={handleOk}>
              确定
            </Button>
          </div>
        </div>
      }
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
            {/* <Option value='remote'>远程规则列表</Option> */}
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
