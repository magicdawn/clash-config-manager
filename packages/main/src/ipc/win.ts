import { BrowserWindow, ipcMain } from 'electron'

ipcMain.handle('set-top-most', (event, flag: boolean) => {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return

  if (flag) {
    win.setAlwaysOnTop(flag, 'modal-panel')
  } else {
    win.setAlwaysOnTop(flag)
  }
})
