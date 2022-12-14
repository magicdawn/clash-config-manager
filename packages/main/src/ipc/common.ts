import { ipcMain, dialog, BrowserWindow, app } from 'electron'
import path from 'path'

export const assetsDir = app.isPackaged
  ? path.join(process.resourcesPath, 'assets/')
  : path.join(__dirname, '../../../assets/') // from bundle/development/main/

ipcMain.handle('getAssetsDir', (event) => {
  return assetsDir
})
