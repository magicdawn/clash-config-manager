/**
 * https://github.com/vitejs/vite/discussions/1791
 * https://github.com/Microsoft/monaco-editor/blob/main/docs/integrate-esm.md#using-vite
 */

// react-monaco-editor => momaco-editor/esm/vs/editor/editor.api.js, 而此 entry 只包含基础编辑功能
// 使用 import monaco-editor => monaco-editor/esm/vs/editor.main.js, 导入全部功能(包含其他 language, 查找,替换模块)

// 简单包含所有功能
// import 'monaco-editor'

import 'monaco-editor/languages/definitions/yaml/register.js'
// 也可以更为详细的定制
import * as monaco from 'monaco-editor/editor/editor.api.js' // for api usage
import editorWorker from 'monaco-editor/editor/editor.worker?worker'
// import 'monaco-editor/editor/edcore.main.js' // 新版没有

export { monaco }

self.MonacoEnvironment = {
  getWorker(_, label) {
    return new editorWorker()
  },
}
