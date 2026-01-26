import { ipcRenderer, shell } from 'electron'
import { runGenerate, runGenerateForceUpdate } from './modules/commands/run'
import storage from './storage'

ipcRenderer.on('generate', () => {
  runGenerate()
})
ipcRenderer.on('generate-force-update', () => {
  runGenerateForceUpdate()
})
ipcRenderer.on('open-electron-store-file', () => {
  shell.showItemInFolder(storage.path)
})
