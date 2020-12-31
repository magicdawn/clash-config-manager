import {remote} from 'electron'
import path from 'path'
import fse from 'fs-extra'
import execa from 'execa'
import debugFactory from 'debug'
import React, {useState, useCallback, useRef, useMemo} from 'react'
import {Button, Modal, Input, message, Tooltip, List, Space, Form, Select} from 'antd'
import {useMount, usePersistFn, useUpdateEffect} from 'ahooks'
import {v4 as uuid} from 'uuid'
import Yaml from 'js-yaml'

import useImmerState from '@util/hooks/useImmerState'
import {firstLine, limitLines} from '@util/text-util'
import {useEasy} from '@store'
import {RuleItem} from '@define'

import styles from './index.module.less'
const {Option} = Select
const debug = debugFactory('app:libraryRuleList')
const namespace = 'libraryRuleList'
const TEMP_EDITING_FILE = path.join(remote.app.getPath('userData'), 'temp', '临时文件-关闭生效.yml')

export default function LibraryRuleList() {
  const ruleListModel = useEasy('libraryRuleList')

  useMount(() => {
    ruleListModel.init()
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
        ruleListModel.del(index)
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
        dataSource={ruleListModel.list}
        renderItem={(item, index) => {
          const {type, name, url, content} = item
          return (
            <List.Item style={{display: 'flex'}}>
              <div className='list-item'>
                <div className='name'>名称: {name}</div>
                <div className='type'>类型: {type === 'local' ? '本地' : '远程'}</div>
                <div className='info'>
                  {type === 'local' ? (
                    <Tooltip
                      title={
                        <div style={{whiteSpace: 'pre-wrap', wordBreak: 'break-all'}}>
                          {limitLines(content, 10)}
                        </div>
                      }
                    >
                      <div className='ellipsis' style={{color: 'blue'}}>
                        内容: {firstLine(content)}
                      </div>
                    </Tooltip>
                  ) : (
                    <Tooltip
                      title={
                        <div style={{whiteSpace: 'pre-wrap', wordBreak: 'break-all'}}>{url}</div>
                      }
                    >
                      <div className='ellipsis' style={{color: 'blue'}}>
                        链接: {url}
                      </div>
                    </Tooltip>
                  )}
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
                  type='dashed'
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
                  type='default'
                  danger
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
  const ruleListModel = useEasy('libraryRuleList')

  const readonly = editMode === 'readonly'

  const getDefaultItem = () => ({
    id: uuid(),
    type: 'local',
    name: '',
    url: '',
    content: '',
  })

  const [form] = Form.useForm()
  const [formFields, setFormFields] = useState([])

  const [otherFormData, modifyOtherFormData] = useImmerState<{id?: string}>({})
  const [type, setType] = useImmerState({value: editItem?.type || 'local'})

  const configEditorRef = useRef(null)

  useUpdateEffect(() => {
    let val = editItem || getDefaultItem()

    form.setFieldsValue(val)
    modifyOtherFormData({id: val.id})
    setType({value: val.type})

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
    if (editInEditorMaskVisible) return
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

  const handleSubmit = usePersistFn((item: RuleItem) => {
    const {content} = item

    // add more data
    const {id} = otherFormData
    item.id = id
    item.type = type.value

    const typeValue = type.value
    if (typeValue === 'local') {
      if (!content) {
        return message.error('content can not be empty')
      }

      let err: Error
      try {
        Yaml.safeLoad(content)
      } catch (e) {
        err = e
      }
      if (err) {
        return message.error('yaml load fail: ' + err.stack || err.message)
      }
    }

    if (typeValue === 'remote') {
      item.content = ''
    }

    const err = ruleListModel.check({item, editItemIndex})
    if (err) return message.error(err)

    const mode = editItem ? 'edit' : 'add'
    if (mode === 'add') {
      ruleListModel.add({item})
    } else {
      ruleListModel.edit({item, editItemIndex})
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

  const onAddRule = usePersistFn((rule) => {
    // debugger
    let content = form.getFieldValue('content') || ''

    if (content.split('\n').find((x) => x.includes(rule) && !x.trim().startsWith('#'))) {
      return message.error(`rule ${rule} 已存在`)
    }

    content = content.trimEnd() + '\n' + `  - ${rule}` + '\n'
    form.setFieldsValue({content})
    message.success(`已添加规则 ${rule}`)
  })

  const [editInEditorMaskVisible, setEditInEditorMaskVisible] = useState(false)
  const editInEditor = usePersistFn(async (editor = 'code') => {
    const content = form.getFieldValue('content')
    await fse.outputFile(TEMP_EDITING_FILE, content, 'utf8')

    // wait edit
    setEditInEditorMaskVisible(true)
    let execResults
    const cmd = `${editor} --wait '${TEMP_EDITING_FILE}'`
    try {
      execResults = await execa.command(cmd, {shell: true})
    } catch (e) {
      message.error('执行命令出错: ' + e.message)
      return
    } finally {
      setEditInEditorMaskVisible(false)
    }

    debug('exec: %o', {cmd, execResults})
    const {exitCode} = execResults || {}
    if (exitCode !== 0) {
      message.error(`执行命令出错: exitCode = ${exitCode}`)
      return
    }

    // read & set
    const newContent = await fse.readFile(TEMP_EDITING_FILE, 'utf8')
    if (newContent !== content) {
      form.setFieldsValue({content: newContent})
      message.success('文件内容已更新')
    }
  })

  const contentField = form.getFieldValue('content')
  const showAddRuleButton = useMemo(() => {
    return Boolean(contentField?.indexOf?.('rules:') > -1)
  }, [contentField])

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
          {type.value === 'local' && (
            <>
              {ruleAddVisible && (
                <RuleAddModal
                  visible={ruleAddVisible}
                  setVisible={setRuleAddVisible}
                  onOk={onAddRule}
                />
              )}

              <Space direction='horizontal'>
                {showAddRuleButton && (
                  <Button disabled={editInEditorMaskVisible} onClick={handleAddRuleChrome}>
                    从 Chrome 添加规则
                  </Button>
                )}
              </Space>
            </>
          )}

          <div style={{flex: 1}}></div>

          <div className='btn-wrapper'>
            <Button disabled={editInEditorMaskVisible} onClick={handleCancel}>
              取消
            </Button>
            <Button disabled={editInEditorMaskVisible} type='primary' onClick={handleOk}>
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
        fields={formFields}
        onFieldsChange={(changedFields, allFields) => {
          setFormFields(allFields)
        }}
      >
        <Form.Item label='类型' name='type' rules={[{required: true, message: '类型不能为空'}]}>
          <Select
            style={{width: '200px'}}
            disabled={readonly}
            value={type.value}
            onChange={(value) => setType({value})}
          >
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

        {type.value === 'local' ? (
          <Form.Item
            label='content'
            name='content'
            rules={[{required: true, message: '内容不能为空'}]}
          >
            <ConfigEditor
              id={otherFormData.id}
              visible={visible}
              ref={configEditorRef}
              readonly={readonly}
              header={
                <>
                  <Space direction='horizontal'>
                    <Button disabled={editInEditorMaskVisible} onClick={() => editInEditor('code')}>
                      使用 vscode 编辑
                    </Button>
                    <Button disabled={editInEditorMaskVisible} onClick={() => editInEditor('atom')}>
                      使用 Atom 编辑
                    </Button>
                  </Space>
                </>
              }
              spinProps={{
                size: 'large',
                spinning: editInEditorMaskVisible,
                // @ts-ignore
                tip: (
                  <>
                    文件已经在编辑器中打开
                    <br />
                    在编辑器中关闭文件生效
                  </>
                ),
              }}
            />
          </Form.Item>
        ) : (
          <Form.Item label='URL' name='url' rules={[{required: true, message: 'url不能为空'}]}>
            <Input.TextArea
              className='input-row'
              onPressEnter={onInputPressEnter}
              autoSize={{minRows: 3, maxRows: 10}}
              disabled={readonly}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}
