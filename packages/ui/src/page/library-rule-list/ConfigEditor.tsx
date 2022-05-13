import MonacoEditor, { EditorWillMount } from 'react-monaco-editor'
import React, { forwardRef, ReactNode } from 'react'
import { useMemoizedFn, useUpdateEffect } from 'ahooks'
import { Spin } from 'antd'
import { SpinProps } from 'antd/lib/spin'
import style from './ConfigEditor.module.less'
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api'

interface IProps {
  id?: string
  value?: string
  onChange?: (val: string) => void
  readonly: boolean
  spinProps?: SpinProps
  header: ReactNode
  visible: boolean
}

export default forwardRef(ConfigEditor)

function ConfigEditor(props: IProps, ref) {
  const { value, onChange, readonly, spinProps, header, visible } = props

  const editorWillMount: EditorWillMount = useMemoizedFn((monaco) => {
    //
  })

  const editorDidMount = useMemoizedFn((editor, monaco) => {
    ;(window as any).$editor = editor
    ;(window as any).$monaco = monaco

    // ref
    ref.current = editor

    // focus
    editor.focus()

    // extra options
    const model = editor.getModel()
    model.updateOptions({
      tabSize: 2,
    })
  })

  const editorOnChange = useMemoizedFn((newValue, e) => {
    onChange(newValue)
  })

  const options: monacoEditor.editor.IStandaloneEditorConstructionOptions = {
    minimap: { enabled: false },
    overviewRulerBorder: true,
    renderIndentGuides: true,
    scrollBeyondLastLine: false,
    scrollbar: {
      horizontal: 'hidden',
    },
    fontSize: 14,
    fontFamily: 'Menlo, Hack, "Ubuntu Mono"',
    automaticLayout: true,
    renderFinalNewline: true,
    readOnly: readonly,
  }

  useUpdateEffect(() => {
    ref.current?.updateOptions({ ...options, readOnly: readonly })
  }, [readonly, ref])

  useUpdateEffect(() => {
    if (visible) {
      ref.current?.setSelection({
        endColumn: 0,
        endLineNumber: 0,
        startColumn: 0,
        startLineNumber: 0,
      })
    }
  }, [visible])

  return (
    <>
      <Spin {...spinProps}>
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
