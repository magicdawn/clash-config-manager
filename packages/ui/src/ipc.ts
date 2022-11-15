import { ipcRenderer } from 'electron'
import pmap from 'promise.map'
import { runGenerate, runGenerateForceUpdate } from './commands/run'
import { currentConfigUsingAndEnabled } from './page/current-config/model'
import { rootActions, rootState } from './store'

ipcRenderer.on('generate', () => {
  runGenerate()
})
ipcRenderer.on('generate-force-update', () => {
  runGenerateForceUpdate()
})

// 更新订阅, 并生成
ipcRenderer.on('update-subscribe-and-generate', async () => {
  // 更新订阅
  const urls = rootState.librarySubscribe.list
    .filter((item) => currentConfigUsingAndEnabled(item))
    .map((x) => x.url)
  await pmap(urls, (url) => rootActions.librarySubscribe.update({ url, forceUpdate: true }), 5)

  // 生成
  await runGenerate()
})
