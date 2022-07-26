/**
 * https://github.com/vitejs/vite/discussions/1791
 * https://github.com/Microsoft/monaco-editor/blob/main/docs/integrate-esm.md#using-vite
 */

// react-monaco-editor => momaco-editor/esm/vs/editor/editor.api.js, 而此 entry 只包含基础编辑功能
// 使用 import monaco-editor => monaco-editor/esm/vs/editor.main.js, 导入全部功能(包含其他 language, 查找,替换模块)
// 也可以更为详细的定制, 这里简单包含所有功能
import 'monaco-editor'

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

// @ts-ignore
self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    return new editorWorker()
  },
}
