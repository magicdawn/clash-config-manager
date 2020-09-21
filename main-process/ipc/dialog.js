import {ipcMain, dialog, BrowserWindow} from 'electron'

ipcMain.handle('select-file', async (event, ...args) => {
  const win = BrowserWindow.fromWebContents(event.sender)

  const {canceled, filePaths} = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [
      {name: 'json', extensions: ['json']},
      {name: 'All Files', extensions: ['*']},
    ],
  })

  if (canceled) {
    return
  } else {
    return filePaths[0]
  }
})
