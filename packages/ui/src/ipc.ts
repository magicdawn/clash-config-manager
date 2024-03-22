import { ipcRenderer } from 'electron'
import { runGenerate, runGenerateForceUpdate } from './modules/commands/run'

ipcRenderer.on('generate', () => {
  runGenerate()
})
ipcRenderer.on('generate-force-update', () => {
  runGenerateForceUpdate()
})
