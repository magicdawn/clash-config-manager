import { state as preferenceState } from '$ui/page/preference/model'
import { useMemoizedFn, useUpdateEffect } from 'ahooks'
import { Spin } from 'antd'
import { SpinProps } from 'antd/lib/spin'
import * as EditorApi from 'monaco-editor/esm/vs/editor/editor.api'
import { MutableRefObject, ReactNode, useMemo, useRef } from 'react'
import MonacoEditor, { EditorDidMount, EditorWillMount, monaco } from 'react-monaco-editor'
import { useSnapshot } from 'valtio'
import style from './CodeEditor.module.less'

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

  const options = useMemo(() => {
    const opts: EditorApi.editor.IStandaloneEditorConstructionOptions = {
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
      trimAutoWhitespace: true,
      contextmenu: true,
      // mouseWheelZoom: false,
      // mouseWheelScrollSensitivity: 0.1,
      occurrencesHighlight: false,
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

      // ref.current?.executeCommand('user',  )
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
