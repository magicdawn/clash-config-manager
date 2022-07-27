import { runCommand } from '$ui/commands/run'
import { RuleItem } from '$ui/common/define'
import useImmerState from '$ui/util/hooks/useImmerState'
import { firstLine, limitLines } from '$ui/util/text-util'
import { FileAddOutlined } from '@ant-design/icons'
import * as remote from '@electron/remote'
import { LinkTwo, SdCard } from '@icon-park/react'
import { useMemoizedFn, useUpdateEffect } from 'ahooks'
import { Button, Form, Input, List, message, Modal, Select, Space, Tooltip } from 'antd'
import debugFactory from 'debug'
import execa from 'execa'
import fse from 'fs-extra'
import Yaml from 'js-yaml'
import path from 'path'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import RuleAddModal from './AddRuleModal'
import ConfigEditor, { EditorRefInner } from './ConfigEditor'
import styles from './index.module.less'
import { actions, state } from './model'

const { Option } = Select
const debug = debugFactory('app:libraryRuleList')
const TEMP_EDITING_FILE = path.join(remote.app.getPath('userData'), 'temp', '临时文件-关闭生效.yml')

type EditMode = 'edit' | 'readonly'

export default function LibraryRuleList() {
  const [showModal, showModalSet] = useState(false)
  const [editItem, editItemSet] = useState<RuleItem | null>(null)
  const [editItemIndex, editItemIndexSet] = useState<number | null>(null)
  const [editMode, editModeSet] = useState<EditMode>('edit')

  const { list } = useSnapshot(state)

  const add = useMemoizedFn(() => {
    editItemSet(null)
    editItemIndexSet(null)
    editModeSet('edit')
    showModalSet(true)
  })

  const edit = useMemoizedFn((item, index) => {
    editItemSet(item)
    editItemIndexSet(index)
    editModeSet('edit')
    showModalSet(true)
  })

  const view = useMemoizedFn((item, index) => {
    editItemSet(item)
    editItemIndexSet(index)
    editModeSet('readonly')
    showModalSet(true)
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
        actions.del(index)
      },
    })
  })

  return (
    <div className={styles.page}>
      <h1>配置源管理</h1>

      <ModalAdd
        {...{ visible: showModal, setVisible: showModalSet, editItem, editItemIndex, editMode }}
      />

      <List
        size='default'
        header={
          <div className='header'>
            <h4>配置源管理</h4>
            <Button type='primary' onClick={add}>
              <FileAddOutlined />
            </Button>
          </div>
        }
        bordered
        dataSource={list}
        renderItem={(item, index) => {
          const { type, name, url, content = '' } = item as RuleItem
          return (
            <List.Item style={{ display: 'flex' }}>
              <div className='list-item'>
                <div className='name' style={{ display: 'flex', height: 24, alignItems: 'center' }}>
                  <span>名称: {name}</span>
                  <span style={{ marginLeft: 5, marginTop: 4 }}>
                    {type === 'local' ? (
                      <SdCard theme='outline' size='18' fill='#333' title='本地规则' />
                    ) : (
                      <LinkTwo theme='outline' size='18' fill='#333' title='远程规则' />
                    )}
                  </span>
                </div>

                <div className='info'>
                  {type === 'local' ? (
                    <Tooltip
                      title={
                        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                          {limitLines(content, 10)}
                        </div>
                      }
                    >
                      <div className='ellipsis' style={{ color: 'blue' }}>
                        内容: {firstLine(content)}
                      </div>
                    </Tooltip>
                  ) : (
                    <Tooltip
                      title={
                        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{url}</div>
                      }
                    >
                      <div className='ellipsis' style={{ color: 'blue' }}>
                        链接: {url}
                      </div>
                    </Tooltip>
                  )}
                </div>
              </div>

              <Space style={{ display: 'flex', alignItems: 'center' }}>
                <Button
                  type='primary'
                  onClick={(e) => edit(item, index)}
                  onKeyDown={disableEnterAsClick}
                >
                  编辑
                </Button>

                <Button
                  type='default'
                  onClick={(e) => view(item, index)}
                  onKeyDown={disableEnterAsClick}
                >
                  查看
                </Button>

                <Button
                  type='primary'
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

type ModalAddProps = {
  visible: boolean
  setVisible: (val: boolean) => void
  editItem: RuleItem | null
  editItemIndex: number | null
  editMode: EditMode
}

function ModalAdd({ visible, setVisible, editItem, editItemIndex, editMode }: ModalAddProps) {
  const readonly = editMode === 'readonly'

  const getDefaultItem = () => ({
    id: crypto.randomUUID(),
    type: 'local',
    name: '',
    url: '',
    content: '',
  })

  const [form] = Form.useForm()
  const [formFields, setFormFields] = useState<any[]>([])

  const [otherFormData, modifyOtherFormData] = useImmerState<{ id?: string }>({})
  const [type, setType] = useImmerState({ value: editItem?.type || 'local' })

  const monacoEditorRef = useRef<EditorRefInner | null>(null)

  useUpdateEffect(() => {
    const val = editItem || getDefaultItem()

    form.setFieldsValue(val)
    modifyOtherFormData({ id: val.id })
    setType({ value: val.type })

    if (visible) {
      setTimeout(() => {
        const editor = monacoEditorRef.current
        if (!editor) return
        editor.focus()
        editor.setPosition({ lineNumber: 1, column: 1 })
      }, 100)
    }
  }, [editItem, visible])

  const clean = () => {
    form.resetFields()
  }

  const layout = {
    labelCol: { span: 3 },
    wrapperCol: { span: 21 },
  }

  const handleCancel = useCallback(() => {
    if (editInEditorMaskVisible) return
    setVisible(false)
    clean()
  }, [])

  const handleOk = useMemoizedFn((e) => {
    e?.preventDefault()
    e?.stopPropagation()
    form.submit()
  })

  const handleOkAndGenerate = useMemoizedFn(async (e) => {
    handleOk(e)

    // wait close
    await new Promise((r) => {
      setTimeout(r, 10)
    })
    runCommand('generate')
  })

  const onInputPressEnter = useMemoizedFn((e) => {
    e?.preventDefault()
    e?.stopPropagation()
    form.submit()
  })

  const handleSubmit = useMemoizedFn((item: RuleItem) => {
    const { content } = item

    // add more data
    const { id } = otherFormData
    item.id = id!
    item.type = type.value

    const typeValue = type.value
    if (typeValue === 'local') {
      if (!content) {
        return message.error('content can not be empty')
      }

      let err: Error | undefined
      try {
        Yaml.load(content)
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

    const err = actions.check({ item, editItemIndex })
    if (err) return message.error(err)

    const mode = editItem ? 'edit' : 'add'
    if (mode === 'add') {
      actions.add({ item })
    } else {
      actions.edit({ item, editItemIndex: editItemIndex! })
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

  const onAddRule = useMemoizedFn((rule) => {
    // debugger
    let content = form.getFieldValue('content') || ''

    if (content.split('\n').find((x: string) => x.includes(rule) && !x.trim().startsWith('#'))) {
      return message.error(`rule ${rule} 已存在`)
    }

    content = content.trimEnd() + '\n' + `  - ${rule}` + '\n'
    form.setFieldsValue({ content })
    message.success(`已添加规则 ${rule}`)
  })

  const [editInEditorMaskVisible, setEditInEditorMaskVisible] = useState(false)
  const editInEditor = useMemoizedFn(async (editor = 'code') => {
    const content = form.getFieldValue('content')
    await fse.outputFile(TEMP_EDITING_FILE, content, 'utf8')

    // wait edit
    setEditInEditorMaskVisible(true)
    let execResults
    const cmd = `${editor} --wait '${TEMP_EDITING_FILE}'`
    try {
      execResults = await execa.command(cmd, { shell: true })
    } catch (e) {
      message.error('执行命令出错: ' + e.message)
      return
    } finally {
      setEditInEditorMaskVisible(false)
    }

    debug('exec: %o', { cmd, execResults })
    const { exitCode } = execResults || {}
    if (exitCode !== 0) {
      message.error(`执行命令出错: exitCode = ${exitCode}`)
      return
    }

    // read & set
    const newContent = await fse.readFile(TEMP_EDITING_FILE, 'utf8')
    if (newContent !== content) {
      form.setFieldsValue({ content: newContent })
      message.success('文件内容已更新')
    }
  })

  const contentField = Form.useWatch('content', form)
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

          <div style={{ flex: 1 }}></div>

          <div className='btn-wrapper'>
            <Button disabled={editInEditorMaskVisible} onClick={handleCancel}>
              取消
            </Button>

            <Button disabled={editInEditorMaskVisible} type='default' onClick={handleOkAndGenerate}>
              确定 (并重新生成)
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
        <Form.Item label='类型' name='type' rules={[{ required: true, message: '类型不能为空' }]}>
          <Select
            style={{ width: '200px' }}
            disabled={readonly}
            value={type.value}
            onChange={(value) => setType({ value })}
          >
            <Option value='local'>本地存储</Option>
            <Option value='remote'>远程规则列表</Option>
          </Select>
        </Form.Item>

        <Form.Item label='名称' name='name' rules={[{ required: true, message: '名称不能为空' }]}>
          <Input
            className='input-row'
            onPressEnter={onInputPressEnter}
            style={{ width: '200px' }}
            disabled={readonly}
          />
        </Form.Item>

        {type.value === 'local' ? (
          <Form.Item
            label='content'
            name='content'
            rules={[{ required: true, message: '内容不能为空' }]}
          >
            <ConfigEditor
              id={otherFormData.id}
              visible={visible}
              editorRef={monacoEditorRef}
              readonly={readonly}
              header={
                <Space direction='horizontal'>
                  <Button disabled={editInEditorMaskVisible} onClick={() => editInEditor('code')}>
                    使用 vscode 编辑
                  </Button>
                  <Button disabled={editInEditorMaskVisible} onClick={() => editInEditor('atom')}>
                    使用 Atom 编辑
                  </Button>
                </Space>
              }
              spinProps={{
                size: 'large',
                spinning: editInEditorMaskVisible,
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
          <Form.Item label='URL' name='url' rules={[{ required: true, message: 'url不能为空' }]}>
            <Input.TextArea
              className='input-row'
              onPressEnter={onInputPressEnter}
              autoSize={{ minRows: 3, maxRows: 10 }}
              disabled={readonly}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}
