import { colorHighlightValue } from '$ui/common'
import { LocalRuleItem, RuleItem } from '$ui/define'
import {
  CodeEditor,
  CodeEditorHelp,
  CodeThemeSelect,
  EditorRefInner,
  showCode,
} from '$ui/modules/code-editor'
import { runGenerate } from '$ui/modules/commands/run'
import { message } from '$ui/store'
import { useIsDarkMode } from '$ui/utility/hooks/useIsDarkMode'
import { getRuleItemContent } from '$ui/utility/remote-rules'
import { firstLine, limitLines } from '$ui/utility/text-util'
import { FileAddOutlined } from '@ant-design/icons'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { restrictToFirstScrollableAncestor, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import * as remote from '@electron/remote'
import { css } from '@emotion/react'
import { LinkTwo, SdCard } from '@icon-park/react'
import { useMemoizedFn } from 'ahooks'
import {
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
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
import {
  CSSProperties,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
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

  const contextIds = useMemo(() => list.map((x) => x.id), [list])

  const onDragEnd = useMemoizedFn((e: DragEndEvent) => {
    const { over, active } = e
    // validate
    if (!over?.id || !active.id || over.id === active.id) return
    // change
    const oldIndex = contextIds.indexOf(active.id.toString())
    const newIndex = contextIds.indexOf(over.id.toString())
    state.list = arrayMove(state.list.slice(), oldIndex, newIndex)
  })

  // const sensors = useSensors(
  //   useSensor(PointerSensor, {
  //     activationConstraint: {
  //       distance: 10,
  //     },
  //   }),
  //   useSensor(KeyboardSensor, {
  //     coordinateGetter: sortableKeyboardCoordinates,
  //   })
  // )

  return (
    <div className={styles.page}>
      <ModalAddOrEdit />

      <div className='header'>
        <div style={{ fontSize: '2em' }}>配置源管理</div>
        <span>
          <Button onClick={addRuleConfig}>
            <FileAddOutlined />
            新建纯规则配置
          </Button>
          <Button type='primary' onClick={add} style={{ marginLeft: 5 }}>
            <FileAddOutlined />
            新建配置
          </Button>
        </span>
      </div>

      <div className='list-items-container'>
        <DndContext
          modifiers={[restrictToFirstScrollableAncestor, restrictToVerticalAxis]}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={contextIds} strategy={verticalListSortingStrategy}>
            {list.map((item, index) => (
              <PartialConfigItem key={item.id} item={item} index={index} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}

export function PartialConfigItem({ item, index }: { item: RuleItem; index: number }) {
  const { type, name, id } = item

  const {
    //
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    active,
    isDragging,
    isSorting,
  } = useSortable({ id })

  const dragStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const dragActiveStyle: CSSProperties | undefined = isDragging
    ? { backgroundColor: '#eea' }
    : undefined

  /**
   * Actions
   */

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
    if (item.type === 'remote') {
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
    <div
      data-as='list-item'
      style={{ ...dragStyle, ...dragActiveStyle, display: 'flex' }}
      ref={setNodeRef}
      css={css`
        flex: 1;
        margin-block: 15px;
        margin-inline: 15px 30px;

        display: flex;
        justify-content: space-between;
        align-items: center;

        border-radius: 10px;
        padding: 10px 10px;

        border: 2px solid var(--border-c);
        &:hover {
          border-color: ${colorHighlightValue};
        }
      `}
    >
      <div
        css={css`
          flex: 1;
          overflow: hidden;
        `}
      >
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
                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{item.url}</div>
              }
            >
              <div className='ellipsis'>链接: {item.url}</div>
            </Tooltip>
          )}
        </div>
      </div>

      <div
        className='drag-handle'
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        css={css`
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;

          margin-left: 25px;
          margin-right: 15px;
          border-radius: 5px;
          flex-shrink: 0;

          cursor: grab;
          &:hover {
            background-color: #eee;
          }
        `}
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='32'
          height='32'
          viewBox='0 0 15 15'
          css={css`
            width: 20px;
            height: 20px;
          `}
        >
          <path
            fill='#888888'
            fillRule='evenodd'
            d='M2.5 4.1a.4.4 0 1 0 0 .8h10a.4.4 0 0 0 0-.8h-10Zm0 2a.4.4 0 1 0 0 .8h10a.4.4 0 0 0 0-.8h-10Zm-.4 2.4c0-.22.18-.4.4-.4h10a.4.4 0 0 1 0 .8h-10a.4.4 0 0 1-.4-.4Zm.4 1.6a.4.4 0 0 0 0 .8h10a.4.4 0 0 0 0-.8h-10Z'
            clipRule='evenodd'
          />
        </svg>
      </div>

      <div
        className='list-item-actions'
        css={css`
          flex-shrink: 0;
        `}
      >
        <Space style={{ display: 'flex', alignItems: 'center' }}>
          <Button
            type='primary'
            onClickCapture={(e) => {
              e.preventDefault()
              e.stopPropagation()
              edit(item, index)
            }}
            onKeyDown={disableEnterAsClick}
          >
            编辑
          </Button>

          <Button type='default' onClick={(e) => view(item, index)} onKeyDown={disableEnterAsClick}>
            查看
          </Button>

          <Button type='primary' danger onClick={() => del(index)} onKeyDown={disableEnterAsClick}>
            删除
          </Button>
        </Space>

        {type === 'remote' && (
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
      width={'95vw'}
      centered
      css={css`
        .ant-form-item {
          margin-bottom: 10px;
        }
      `}
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

            <Space className='btn-wrapper'>
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
            </Space>
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
            <Option value='local'>本地 config</Option>
            <Option value='remote'>远程 config</Option>
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

        {type === 'remote' && (
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
      </Form>
    </Modal>
  )
}
