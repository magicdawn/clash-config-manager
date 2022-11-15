import { useMemoizedFn, useUpdateEffect } from 'ahooks'
import { Spin } from 'antd'
import { SpinProps } from 'antd/lib/spin'
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api'
import { MutableRefObject, ReactNode, useMemo, useRef } from 'react'
import MonacoEditor, { EditorDidMount, EditorWillMount, monaco } from 'react-monaco-editor'
import style from './ConfigEditor.module.less'

export type EditorRefInner = monaco.editor.IStandaloneCodeEditor

interface IProps {
  readonly: boolean
  open: boolean
  value?: string // value is required, but antd <Form.Item> can auto bind
  onChange?: (val: string) => void
  spinProps?: SpinProps
  header?: ReactNode
  editorRef?: MutableRefObject<EditorRefInner | null>
}

export default function ConfigEditor(props: IProps) {
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
  })

  const editorOnChange = useMemoizedFn((newValue, e) => {
    onChange?.(newValue)
  })

  const options = useMemo(() => {
    const opts: monacoEditor.editor.IStandaloneEditorConstructionOptions = {
      minimap: { enabled: false },
      overviewRulerBorder: true,
      // renderIndentGuides: true,
      scrollBeyondLastLine: false,
      scrollbar: {
        horizontal: 'hidden',
      },
      fontSize: 14,
      fontFamily: 'Menlo, Hack, "Ubuntu Mono"',
      automaticLayout: true,
      renderFinalNewline: true,
      readOnly: readonly,
      find: {
        loop: false,
        seedSearchStringFromSelection: 'selection',
      },
    }
    return opts
  }, [readonly])

  useUpdateEffect(() => {
    ref.current?.updateOptions({ ...options, readOnly: readonly })
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
            theme='quite-light'
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
