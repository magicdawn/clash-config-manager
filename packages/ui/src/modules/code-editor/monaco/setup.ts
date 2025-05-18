/**
 * https://github.com/vitejs/vite/discussions/1791
 * https://github.com/Microsoft/monaco-editor/blob/main/docs/integrate-esm.md#using-vite
 */

// react-monaco-editor => momaco-editor/esm/vs/editor/editor.api.js, 而此 entry 只包含基础编辑功能
// 使用 import monaco-editor => monaco-editor/esm/vs/editor.main.js, 导入全部功能(包含其他 language, 查找,替换模块)

// 简单包含所有功能
// import 'monaco-editor'

// 也可以更为详细的定制
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js'
import 'monaco-editor/esm/vs/editor/edcore.main.js'

// for api usage
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
export { monaco }
self.MonacoEnvironment = {
  getWorker(_, label) {
    return new editorWorker()
  },
}
