import path from 'node:path'
import { app, ipcMain } from 'electron'

export const assetsDir = app.isPackaged
  ? path.join(process.resourcesPath, 'assets/')
  : path.join(import.meta.dirname, '../../../assets/') // from bundle/development/main/

ipcMain.handle('getAssetsDir', (event) => {
  return assetsDir
})
