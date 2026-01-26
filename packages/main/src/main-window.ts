import path from 'node:path'
import * as remoteMain from '@electron/remote/main'
import { app, BrowserWindow, shell, type Event } from 'electron'
import windowStateKeeper from 'electron-window-state'

export interface AppMainWindow extends BrowserWindow {
  preventClose?: () => void
  stopPreventClose?: () => void
}

export let mainWindow: AppMainWindow | undefined
export async function initMainWindow() {
  mainWindow = createMainWindow()

  // enable @electron/remote
  remoteMain.initialize()
  remoteMain.enable(mainWindow.webContents)

  if (process.env.NODE_ENV === 'production') {
    await mainWindow.loadFile(path.join(import.meta.dirname, '../renderer/index.html'))
  } else {
    await mainWindow.loadURL('http://localhost:7749')
  }
}

const createMainWindow = () => {
  // Load the previous state with fallback to defaults
  const mainWindowState = windowStateKeeper({
    defaultWidth: 800,
    defaultHeight: 600,
  })

  const win: AppMainWindow = new BrowserWindow({
    title: app.name,
    show: false,
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      webSecurity: false,
      spellcheck: false,
      enableDeprecatedPaste: true, // monaco-editor 需要
    },
  })

  // Emitted when the web page has been rendered (while not being shown) and window can be displayed without a visual flash.
  // Please note that using this event implies that the renderer will be considered "visible" and paint even though show is false.
  // This event will never fire if you use paintWhenInitiallyHidden: false
  win.on('ready-to-show', () => {
    win.show()
  })

  // new-window event deprecated
  win.webContents.setWindowOpenHandler(({ url }) => {
    // open url in a browser and prevent default
    shell.openExternal(url)
    return { action: 'deny' }
  })

  const preventClose = (e: Event) => {
    e.preventDefault()

    const hideAction = () => {
      win.hide()
      app.dock?.hide()
    }

    if (win.isFullScreen()) {
      win.once('leave-full-screen', () => hideAction())
      win.setFullScreen(false) // 直接 hide 全屏窗口会导致黑屏
    } else {
      hideAction()
    }
  }

  const stopPreventClose = () => win.off('close', preventClose)
  win.stopPreventClose = stopPreventClose

  win.on('close', preventClose)
  app.on('before-quit', stopPreventClose)

  mainWindowState.manage(win)
  return win
}
