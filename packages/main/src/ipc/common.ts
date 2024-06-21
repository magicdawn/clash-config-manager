import { app, ipcMain } from 'electron'
import path from 'path'

export const assetsDir = app.isPackaged
  ? path.join(process.resourcesPath, 'assets/')
  : path.join(import.meta.dirname, '../../../assets/') // from bundle/development/main/

ipcMain.handle('getAssetsDir', (event) => {
  return assetsDir
})
