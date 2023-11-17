import { state as preferenceState } from '$ui/page/preference/model'
import { QuestionCircleFilled } from '@ant-design/icons'
import { useMemoizedFn, useUpdateEffect } from 'ahooks'
import { Spin, Tag, Tooltip } from 'antd'
import { SpinProps } from 'antd/lib/spin'
import * as EditorApi from 'monaco-editor/esm/vs/editor/editor.api'
import { CSSProperties, MutableRefObject, ReactNode, useMemo, useRef } from 'react'
import MonacoEditor, { EditorDidMount, EditorWillMount, monaco } from 'react-monaco-editor'
import { useSnapshot } from 'valtio'
import style from './CodeEditor.module.less'

export type EditorRefInner = monaco.editor.IStandaloneCodeEditor

export function CodeEditorHelp({
  style,
  className,
}: {
  style?: CSSProperties
  className?: string
}) {
  return (
    <Tooltip
      placement='left'
      title={
        <ul style={{ marginLeft: '-20px', minWidth: 250 }}>
          <li>
            <span>
              <Tag>CMD+-</Tag>缩小 font-size
            </span>
            <span>
              <Tag>CMD+=</Tag>增加 font-size
            </span>
            <span>
              <Tag>CMD+-</Tag>重置 font-size
            </span>
          </li>
          <li>
            <Tag>CMD+Ctrl+UP</Tag> 当前行上移
            <Tag>CMD+Ctrl+DOWN</Tag> 当前行下移
          </li>
          <li>
            <Tag>Alt+UP</Tag> 当前行上移
            <Tag>Alt+DOWN</Tag> 当前行下移
          </li>
          <li>
            <Tag>CMD+/</Tag> 注释/取消注释
          </li>
        </ul>
      }
    >
      <QuestionCircleFilled style={{ ...style }} className={className} />
    </Tooltip>
  )
}

interface IProps {
  readonly: boolean
  open: boolean
  value?: string // value is required, but antd <Form.Item> can auto bind
  onChange?: (val: string) => void
  spinProps?: SpinProps
  header?: ReactNode
  editorRef?: MutableRefObject<EditorRefInner | null>
}

const fontSize = 15
const fontFamily = `
Hack
Jetbrains Mono
Menlo
Consolas
Ubuntu Mono
`
  .split('\n')
  .map((x) => x.trim())
  .filter(Boolean)
  .map((name) => JSON.stringify(name))
  .join(', ')
// console.log(fontFamily)

export function CodeEditor(props: IProps) {
  //  'vs' (default), 'vs-dark', 'hc-black', 'hc-light
  const theme = useSnapshot(preferenceState).vscodeTheme || 'vs'

  const { value, onChange, readonly, spinProps, header, open, editorRef } = props

  const ref = useRef<EditorRefInner | null>(null)

  const editorWillMount: EditorWillMount = useMemoizedFn((monaco) => {
    //
  })

  const editorDidMount: EditorDidMount = useMemoizedFn((editor, monaco) => {
    // FIXME
    ;(window as any).$editor = editor
    ;(window as any).$monaco = monaco

    // ref
    ref.current = editor
    if (editorRef) {
      editorRef.current = editor
    }

    // focus
    editor.focus()

    // extra options
    const model = editor.getModel()
    model?.updateOptions({
      tabSize: 2,
    })

    // CMD+S 保存
    //

    // CMD+Ctrl+Up/Down move line up/down
    //
    // editor.getAction()
  })

  const editorOnChange = useMemoizedFn((newValue, e) => {
    onChange?.(newValue)
  })

  type EOptions = EditorApi.editor.IStandaloneEditorConstructionOptions

  const readOnlyOptions = (readOnly: boolean): Partial<EOptions> => {
    return {
      readOnly,
      cursorStyle: readOnly ? 'underline-thin' : 'line-thin',
      cursorBlinking: readOnly ? 'solid' : undefined,
    }
  }

  const options = useMemo(() => {
    const opts: EOptions = {
      minimap: { enabled: false },
      overviewRulerBorder: true,
      // renderIndentGuides: true,
      scrollBeyondLastLine: false,
      scrollbar: {
        horizontal: 'hidden',
      },
      fontSize,
      fontFamily,
      automaticLayout: true,
      renderFinalNewline: 'on',
      ...readOnlyOptions(readonly),
      trimAutoWhitespace: true,
      contextmenu: true,
      occurrencesHighlight: false,
      tabSize: 2,
      useTabStops: true,
      find: {
        loop: false,
        seedSearchStringFromSelection: 'selection',
      },
    }
    return opts
  }, [readonly])

  useUpdateEffect(() => {
    ref.current?.updateOptions({
      ...options,
      ...readOnlyOptions(readonly),
    })
  }, [readonly, ref])

  useUpdateEffect(() => {
    if (open) {
      ref.current?.setSelection({
        endColumn: 0,
        endLineNumber: 0,
        startColumn: 0,
        startLineNumber: 0,
      })
    }
  }, [open])

  return (
    <>
      <Spin spinning={false} {...spinProps}>
        {header}
        <div style={{ width: '100%', height: '50vh', marginTop: 10 }} className={style.editor}>
          <MonacoEditor
            language='yaml'
            theme={theme}
            value={value}
            options={options}
            onChange={editorOnChange}
            editorWillMount={editorWillMount}
            editorDidMount={editorDidMount}
          />
        </div>
      </Spin>
    </>
  )
}
