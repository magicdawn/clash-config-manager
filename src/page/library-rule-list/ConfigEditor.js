import MonacoEditor from 'react-monaco-editor'
import React, {forwardRef} from 'react'
import {usePersistFn, useUpdateEffect} from 'ahooks'
import {Spin} from 'antd'
import style from './ConfigEditor.module.less'

export default forwardRef(ConfigEditor)
function ConfigEditor(props, ref) {
  const {value, onChange, readonly, spinProps, header, visible} = props

  const editorWillMount = usePersistFn((editor, monaco) => {})

  const editorDidMount = usePersistFn((editor, monaco) => {
    window.$editor = editor
    window.$monaco = monaco

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

  const editorOnChange = usePersistFn((newValue, e) => {
    onChange(newValue)
  })

  const options = {
    minimap: {enabled: false},
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
    ref.current?.updateOptions({...options, readOnly: readonly})
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
        <div style={{width: '100%', height: '50vh', marginTop: 10}} className={style.editor}>
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
