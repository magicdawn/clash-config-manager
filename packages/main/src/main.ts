import path from 'path'
import { app, BrowserWindow, Menu, session, shell, Tray } from 'electron'
import { is } from 'electron-util'
import _ from 'lodash'
import * as remoteMain from '@electron/remote/main'

import './init/meta'
import { load as loadDevExt } from './dev/ext'
import { loadWindowState, saveWindowState } from './initWindowState'
import './ipc/index'
import setMenu from './menu'

// Prevent window from being garbage collected
let mainWindow: BrowserWindow

declare global {
  namespace NodeJS {
    interface Global {
      mainWindow?: BrowserWindow
    }
  }
}

export async function main() {
  initAppEvents()
  await app.whenReady()

  addRequestExtraHeadersSupport()
  setMenu()
  setTray()
  loadDevExt()

  mainWindow = await createMainWindow()
  global.mainWindow = mainWindow

  // enable @electron/remote
  remoteMain.initialize()
  remoteMain.enable(mainWindow.webContents)

  if (process.env.NODE_ENV === 'production') {
    await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  } else {
    await mainWindow.loadURL('http://localhost:7749')
  }
}

const createMainWindow = async () => {
  const { bounds } = await loadWindowState()

  const win = new BrowserWindow({
    title: app.name,
    show: false,
    x: bounds?.x,
    y: bounds?.y,
    width: bounds?.width,
    height: bounds?.height,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      webSecurity: false,
      spellcheck: false,
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

  const preventClose = (e) => {
    e.preventDefault()

    const hideAction = () => {
      win.hide()
      app.dock.hide()
    }

    if (win.isFullScreen()) {
      win.once('leave-full-screen', () => hideAction())
      win.setFullScreen(false) // 直接 hide 全屏窗口会导致黑屏
    } else {
      hideAction()
    }
  }
  const stopPreventClose = () => win.off('close', preventClose)

  win.on('close', preventClose)
  ;(win as any).stopPreventClose = stopPreventClose
  app.on('before-quit', stopPreventClose)

  const saveWindowStateHandler = _.throttle(() => {
    const bounds = mainWindow?.getBounds()
    if (!bounds) return
    saveWindowState({ bounds })
  }, 1000)
  win.on('resize', () => {
    saveWindowStateHandler()
  })
  win.on('move', () => {
    saveWindowStateHandler()
  })

  return win
}

function initAppEvents() {
  // Prevent multiple instances of the app
  if (!app.requestSingleInstanceLock()) {
    app.quit()
  }

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.show()
    }
  })

  app.on('window-all-closed', () => {
    // none mac
    if (!is.macos) {
      app.quit()
      return
    }
  })

  // Emitted when the application is activated.
  // Various actions can trigger this event, such as
  //  - launching the application for the first time,
  //  - attempting to re - launch the application when it's already running,
  //  - or clicking on the application's dock or taskbar icon.
  app.on('activate', async (e, hasVisibleWindows) => {
    console.log('app.activate, hasVisibleWindows = %s', hasVisibleWindows)
    // 不需要在这里 mainWindow.show()
    // mainWindow.show()
  })

  app.on('before-quit', async () => {
    if (mainWindow) {
      try {
        await saveWindowState({
          bounds: mainWindow?.getBounds?.(),
        })
      } catch (e) {
        // noop
      }
    }
  })
}

function addRequestExtraHeadersSupport() {
  // with this, we can set user-agent in front-end
  // https://stackoverflow.com/a/35672988/2822866
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    let extraHeaders = {}
    if (details.requestHeaders['x-extra-headers']) {
      try {
        extraHeaders = JSON.parse(details.requestHeaders['x-extra-headers'])
      } catch (e) {
        // noop
      }
    }
    callback({ cancel: false, requestHeaders: { ...details.requestHeaders, ...extraHeaders } })
  })
}

function setTray() {
  const icon = app.isPackaged
    ? path.join(process.resourcesPath, 'assets/cat@2x.png')
    : path.join(__dirname, '../../../assets/cat@2x.png')

  const restoreWindow = () => {
    mainWindow?.show()
    app.dock.show()
  }

  const tray = new Tray(icon)
  tray.setToolTip('clash config manager')

  // 不需要菜单, 点击恢复
  // tray.on('click', restoreWindow)

  // 菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      type: 'normal',
      click: restoreWindow,
    },
    {
      type: 'normal',
      label: '重新生成配置',
      click() {
        //
      },
    },
    {
      type: 'separator',
    },
    {
      type: 'normal',
      label: '当前 clash-config-manager',
    },
  ])
  tray.setContextMenu(contextMenu)
}
