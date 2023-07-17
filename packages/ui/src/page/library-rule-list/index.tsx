import { runGenerate } from '$ui/commands/run'
import {
  CodeEditor,
  CodeEditorHelp,
  CodeThemeSelect,
  EditorRefInner,
  showCode,
} from '$ui/common/code'
import { LocalRuleItem, RuleItem } from '$ui/common/define'
import { message } from '$ui/store'
import { useIsDarkMode } from '$ui/util/hooks/useIsDarkMode'
import { getRuleItemContent } from '$ui/util/remote-rules'
import { firstLine, limitLines } from '$ui/util/text-util'
import { FileAddOutlined } from '@ant-design/icons'
import * as remote from '@electron/remote'
import { LinkTwo, SdCard } from '@icon-park/react'
import { useMemoizedFn } from 'ahooks'
import {
  AutoComplete,
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Row,
  Select,
  Space,
  Tooltip,
} from 'antd'
import debugFactory from 'debug'
import { execaCommand } from 'execa'
import fse from 'fs-extra'
import Yaml from 'js-yaml'
import path from 'path'
import { KeyboardEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { proxy, useSnapshot } from 'valtio'
import RuleAddModal from './AddRuleModal'
import styles from './index.module.less'
import { actions, state } from './model'

const { Option } = Select
const debug = debugFactory('app:libraryRuleList')
const TEMP_EDITING_FILE = path.join(remote.app.getPath('userData'), 'temp', '临时文件-关闭生效.yml')

const newUUID = () => crypto.randomUUID()

const editModalData = proxy({
  editItem: undefined as RuleItem | null | undefined,
  editItemIndex: undefined as number | null | undefined,
  readonly: false,
  showModal: false,
})
const updateEditModalData = function (payload: Partial<typeof editModalData>) {
  Object.assign(editModalData, payload)
}

export default function LibraryRuleList() {
  const { list } = useSnapshot(state)

  const add = useMemoizedFn(() => {
    updateEditModalData({
      editItem: getDefaultEditItem(),
      editItemIndex: null,
      readonly: false,
      showModal: true,
    })
  })

  const addRuleConfig = useMemoizedFn(() => {
    const editItem = getDefaultEditItem()
    editItem.content = 'rules:\n  # add rules here\n  '

    updateEditModalData({
      editItem,
      editItemIndex: null,
      readonly: false,
      showModal: true,
    })
  })

  const edit = useMemoizedFn((item: RuleItem, index: number) => {
    updateEditModalData({
      editItem: item,
      editItemIndex: index,
      readonly: false,
      showModal: true,
    })
  })

  const view = useMemoizedFn((item: RuleItem, index: number) => {
    updateEditModalData({
      editItem: item,
      editItemIndex: index,
      readonly: true,
      showModal: true,
    })
  })

  const del = useMemoizedFn((index: number) => {
    Modal.confirm({
      title: '确认删除?',
      onOk() {
        actions.del(index)
      },
    })
  })

  const updateRmote = useMemoizedFn(async (index: number) => {
    const item = state.list[index]
    return actions.updateRemote({ item, forceUpdate: true })
  })

  const viewRmoteContents = useMemoizedFn(async (index: number) => {
    const item = state.list[index]
    if (item.type === 'local') return

    let content: string | undefined
    if (item.type === 'remote' || item.type === 'remote-rule-provider') {
      content = await getRuleItemContent(item.id)
      if (!content) await actions.updateRemote({ item })
      content = await getRuleItemContent(item.id)
    }

    showCode(content || '')
  })

  // disable enter
  const disableEnterAsClick: KeyboardEventHandler = useCallback((e) => {
    if (e.key.toLowerCase() === 'enter') {
      e.preventDefault()
    }
  }, [])

  const isDark = useIsDarkMode()
  const iconFill = isDark ? '#eee' : '#333'

  return (
    <div className={styles.page}>
      <ModalAddOrEdit />

      <List
        size='default'
        header={
          <div className='header'>
            <div style={{ fontSize: '2em' }}>配置源管理</div>
            <span>
              <Button type='ghost' onClick={addRuleConfig}>
                <FileAddOutlined />
                新建纯规则配置
              </Button>
              <Button type='primary' onClick={add} style={{ marginLeft: 5 }}>
                <FileAddOutlined />
                新建配置
              </Button>
            </span>
          </div>
        }
        className={styles.listComponent}
        bordered
        dataSource={list}
        rowKey='id'
        renderItem={(item, index) => {
          const { type, name, id } = item
          return (
            <List.Item style={{ display: 'flex' }}>
              <div className='list-item'>
                <div className='name' style={{ display: 'flex', height: 24, alignItems: 'center' }}>
                  <span>名称: {name}</span>
                  <span style={{ marginLeft: 5, marginTop: 4 }}>
                    {type === 'local' ? (
                      <SdCard theme='outline' size='18' fill={iconFill} title='本地规则' />
                    ) : (
                      <LinkTwo theme='outline' size='18' fill={iconFill} title='远程规则' />
                    )}
                  </span>
                </div>

                <div className='info'>
                  {type === 'local' ? (
                    <Tooltip
                      title={
                        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                          {limitLines(item.content, 10)}
                        </div>
                      }
                    >
                      <div className='ellipsis'>内容: {firstLine(item.content)}</div>
                    </Tooltip>
                  ) : (
                    <Tooltip
                      title={
                        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                          {item.url}
                          {/* debug use */}
                          {/* <p style={{ maxWidth: 500 }}>{JSON.stringify(item)}</p> */}
                        </div>
                      }
                    >
                      <div className='ellipsis'>链接: {item.url}</div>
                    </Tooltip>
                  )}
                </div>
              </div>

              <div>
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
                    onClick={() => del(index)}
                    onKeyDown={disableEnterAsClick}
                  >
                    删除
                  </Button>
                </Space>

                {(type === 'remote' || type === 'remote-rule-provider') && (
                  <Space style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
                    <Button
                      type='primary'
                      onClick={(e) => updateRmote(index)}
                      onKeyDown={disableEnterAsClick}
                    >
                      更新
                    </Button>

                    <Button
                      type='default'
                      onKeyDown={disableEnterAsClick}
                      onClick={(e) => viewRmoteContents(index)}
                    >
                      查看内容
                    </Button>
                  </Space>
                )}
              </div>
            </List.Item>
          )
        }}
      />
    </div>
  )
}

const getDefaultEditItem = () =>
  ({
    id: newUUID(),
    type: 'local',
    name: '',
    content: '',
  }) as LocalRuleItem

const debugModal = debugFactory('app:page:library-rule-list:ModalAddOrEdit')

function ModalAddOrEdit() {
  const { editItem, editItemIndex, readonly, showModal: visible } = useSnapshot(editModalData)

  const monacoEditorRef = useRef<EditorRefInner>(null)
  const [form] = Form.useForm()

  const setVisible = useMemoizedFn((val: boolean) => {
    editModalData.showModal = val
  })

  const type: string = Form.useWatch('type', form)
  debugModal('render() type = %s', type)

  useEffect(() => {
    if (!visible) return

    const val = { ...(editItem || getDefaultEditItem()) } // get rid of proxy
    debugModal('ModalAddOrEdit: updating form fields', val)
    form.setFieldsValue(val)

    setTimeout(() => {
      const editor = monacoEditorRef.current
      if (!editor) return
      editor.focus()
      editor.setPosition({ lineNumber: 1, column: 1 })
    }, 100)
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

    runGenerate()
  })

  const onInputPressEnter = useMemoizedFn((e) => {
    e?.preventDefault()
    e?.stopPropagation()
    form.submit()
  })

  const handleSubmit = useMemoizedFn((values: RuleItem) => {
    console.log(values)

    let item: RuleItem | undefined
    {
      const { id, name, type } = values
      if (type === 'local') {
        item = {
          id,
          name,
          type,

          content: values.content,
        }
      }
      if (type === 'remote') {
        item = {
          id,
          name,
          type,

          url: values.url,
          autoUpdate: values.autoUpdate,
          autoUpdateInterval: values.autoUpdateInterval || autoUpdateIntervalDefault,
        }
      }
      if (type === 'remote-rule-provider') {
        item = {
          id,
          name,
          type,

          url: values.url,
          autoUpdate: values.autoUpdate,
          autoUpdateInterval: values.autoUpdateInterval || autoUpdateIntervalDefault,

          providerBehavior: values.providerBehavior,
          providerPolicy: values.providerPolicy || name,
        }
      }
    }

    if (!item) return

    // validate
    {
      const { type } = item

      if (type === 'local') {
        if (!item.content) {
          return message.error('content can not be empty')
        }

        let err: Error | undefined
        try {
          Yaml.load(item.content)
        } catch (e) {
          err = e
        }
        if (err) {
          return message.error('yaml load fail: ' + err.stack || err.message)
        }
      }

      if (type === 'remote') {
        //
      }
    }

    const err = actions.check({ item, editItemIndex })
    if (err) return message.error(err)

    debug('submit item = %o', item)

    const mode = typeof editItemIndex === 'number' ? 'edit' : 'add'
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

  const [addRuleModalVisible, setAddRuleModalVisible] = useState(false)

  const handleAddRuleChrome = useCallback(() => {
    setAddRuleModalVisible(true)
  }, [])

  const onAddRule = useMemoizedFn((rule) => {
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
      execResults = await execaCommand(cmd, { shell: true })
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

  // min={1} // 1h
  // max={240} // 240h = 10d
  const [autoUpdateIntervalMin, autoUpdateIntervalMax] = [1, 240]
  const autoUpdateIntervalDefault = 24 // 每天更新
  const autoUpdate: boolean = Form.useWatch('autoUpdate', form)

  return (
    <Modal
      className={styles.modal}
      title='添加'
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={'90vw'}
      centered
      maskClosable={false}
      keyboard={false}
      footer={
        !readonly && (
          <div className='footer'>
            {type === 'local' && (
              <>
                {addRuleModalVisible && (
                  <RuleAddModal
                    visible={addRuleModalVisible}
                    setVisible={setAddRuleModalVisible}
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

              <Button
                disabled={editInEditorMaskVisible}
                type='default'
                onClick={handleOkAndGenerate}
              >
                确定 (并重新生成)
              </Button>

              <Button disabled={editInEditorMaskVisible} type='primary' onClick={handleOk}>
                确定
              </Button>
            </div>
          </div>
        )
      }
    >
      <Form
        {...layout}
        form={form}
        name='basic'
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        initialValues={{ autoUpdateInterval: autoUpdateIntervalDefault }}
        disabled={readonly}
      >
        {/* required to store 'id' in form data */}
        <Form.Item name='id' hidden>
          <Input />
        </Form.Item>

        {/* value={type}
            onChange={(value) => setType({ value })} */}
        <Form.Item name='type' label='类型' rules={[{ required: true, message: '类型不能为空' }]}>
          <Select style={{ width: '200px' }} disabled={readonly}>
            <Option value='local'>本地存储</Option>
            <Option value='remote'>远程 config</Option>
            <Option value='remote-rule-provider'>远程 rule-provider</Option>
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

        {type === 'local' && (
          <Form.Item
            label='content'
            name='content'
            rules={[{ required: true, message: '内容不能为空' }]}
          >
            <CodeEditor
              open={visible}
              editorRef={monacoEditorRef}
              readonly={readonly}
              header={
                <Row style={{ alignItems: 'center' }}>
                  <Space direction='horizontal'>
                    <Button
                      disabled={readonly || editInEditorMaskVisible}
                      onClick={() => editInEditor('code')}
                    >
                      使用 vscode 编辑
                    </Button>
                    <Button
                      disabled={readonly || editInEditorMaskVisible}
                      onClick={() => editInEditor('atom')}
                    >
                      使用 Atom 编辑
                    </Button>
                  </Space>

                  <Col flex={1}></Col>

                  <CodeEditorHelp />
                  <span style={{ margin: '0 5px' }}>编辑器主题:</span>
                  <CodeThemeSelect />
                </Row>
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
        )}

        {(type === 'remote' || type === 'remote-rule-provider') && (
          <>
            <Form.Item
              label='URL'
              name='url'
              rules={[{ required: true, message: 'url不能为空' }]}
              className='url'
            >
              <Input.TextArea
                className='input-row'
                onPressEnter={onInputPressEnter}
                autoSize={{ minRows: 1, maxRows: 4 }}
                disabled={readonly}
              />
            </Form.Item>

            <Form.Item
              name='autoUpdate'
              label=''
              wrapperCol={{ offset: 3 }}
              className='auto-update'
              valuePropName='checked'
            >
              <Checkbox style={{ marginLeft: 0 }}>自动更新</Checkbox>
            </Form.Item>

            {autoUpdate && (
              <Form.Item
                name='autoUpdateInterval'
                label='更新间隔'
                className='auto-update-interval'
              >
                <InputNumber
                  addonAfter={'小时'}
                  min={autoUpdateIntervalMin}
                  max={autoUpdateIntervalMax}
                />
              </Form.Item>
            )}
          </>
        )}

        {type === 'remote-rule-provider' && (
          <>
            <Form.Item
              label='Behavior'
              name='providerBehavior'
              rules={[{ required: true, message: '需要选择 rule provider behavior' }]}
            >
              <Select
                style={{ width: '200px' }}
                disabled={readonly}
                options={[
                  {
                    label: 'domain',
                    value: 'domain',
                  },
                  {
                    label: 'ipcidr',
                    value: 'ipcidr',
                  },
                  {
                    label: 'classical',
                    value: 'classical',
                  },
                ]}
              />
            </Form.Item>

            <Form.Item
              label='Policy'
              name='providerPolicy'
              rules={[{ required: false, message: '需要指定 rule provider policy' }]}
            >
              <AutoComplete
                style={{ width: '200px' }}
                disabled={readonly}
                placeholder='默认使用名称作为 policy'
              >
                {['DIRECT', 'REJECT', 'Proxy'].map((t) => (
                  <Option key={t} value={t}>
                    {t}
                  </Option>
                ))}
              </AutoComplete>
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  )
}
