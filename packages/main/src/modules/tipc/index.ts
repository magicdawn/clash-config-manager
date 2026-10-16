/* eslint-disable require-await */
import path from 'node:path'
import { tipc } from '@egoist/tipc/main'
import { app, BrowserWindow, dialog, session } from 'electron'
import { Brave, Chrome } from 'mac-helper'

const t = tipc.create()

export const assetsDir = app.isPackaged
  ? path.join(process.resourcesPath, 'assets/')
  : path.join(import.meta.dirname, '../../../assets/') // from bundle/development/main/

export const router = t.router({
  sum: t.procedure.input<{ a: number; b: number }>().action(async ({ input }) => {
    return input.a + input.b
  }),

  getRunningBrowserInfo: t.procedure.action(async ({ input }) => {
    const brave = {
      running: await Brave.isRunning(),
      url: (await Brave.getActiveTab())?.url,
    }
    const chrome = {
      running: await Chrome.isRunning(),
      url: (await Chrome.getActiveTab())?.url,
    }
    return { brave, chrome }
  }),

  getDirs: t.procedure.action(async () => {
    return { assetsDir }
  }),

  setUseSystemProxy: t.procedure.input<boolean>().action(async ({ input: useSystem }) => {
    await session.defaultSession.closeAllConnections()
    await session.defaultSession.setProxy({ mode: useSystem ? 'system' : 'direct' })
  }),

  setTopMost: t.procedure.input<boolean>().action(async ({ input: flag }) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return
    if (flag) {
      win.setAlwaysOnTop(flag, 'modal-panel')
    } else {
      win.setAlwaysOnTop(flag)
    }
  }),

  selectFile: t.procedure.action(async ({ context: { sender } }) => {
    const win = BrowserWindow.fromWebContents(sender)
    if (!win) return

    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [
        { name: 'json', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    })

    if (canceled) {
      return
    } else {
      return filePaths[0]
    }
  }),
})

export type Router = typeof router
