import { ipcMain, session } from 'electron'

ipcMain.handle('set-use-system-proxy', async (event, useSystem: boolean) => {
  await session.defaultSession.closeAllConnections()
  await session.defaultSession.setProxy({ mode: useSystem ? 'system' : 'direct' })
})
