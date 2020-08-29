import MonacoEditor from 'react-monaco-editor'
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react'
import {usePersistFn, useWhyDidYouUpdate, useUpdateEffect} from 'ahooks'

import style from './ConfigEditor.module.less'

export default forwardRef(ConfigEditor)

function ConfigEditor(props, ref) {
  const {value, onChange} = props

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
    props.onChange(newValue)
  })

  const options = {
    minimap: {enabled: false},
    overviewRulerBorder: true,
    renderIndentGuides: true,
    scrollBeyondLastLine: false,
    scrollbar: {
      horizontal: 'hidden',
    },
    fontSize: 16,
    fontFamily: 'Hack, Menlo, "Ubuntu Mono"',
    automaticLayout: true,
    renderFinalNewline: true,
  }

  return (
    <div style={{width: '100%', height: '300px'}} className={style.editor}>
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
  )
}
