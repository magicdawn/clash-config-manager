import path from 'node:path'
import * as remoteMain from '@electron/remote/main'
import { app, BrowserWindow, Menu, session, shell, Tray, type Event } from 'electron'
import { is } from 'electron-util'
import windowStateKeeper from 'electron-window-state'
import { initLoadDevtoolExtensions as loadDevExt } from './modules/devtool-extensions'
import { assetsDir } from './modules/ipc/common'
import setMenu from './modules/menu'

export let mainWindow: BrowserWindow
export async function initMainWindow() {
  initAppEvents()
  await app.whenReady()

  addRequestExtraHeadersSupport()
  setMenu()
  setTray()
  loadDevExt()

  mainWindow = createMainWindow()
  globalThis.mainWindow = mainWindow

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

  const win = new BrowserWindow({
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

  win.on('close', preventClose)
  ;(win as any).stopPreventClose = stopPreventClose
  app.on('before-quit', stopPreventClose)

  mainWindowState.manage(win)
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
  app.on('activate', (e, hasVisibleWindows) => {
    console.log('app.activate, hasVisibleWindows = %s', hasVisibleWindows)
    if (!hasVisibleWindows) {
      restoreWindow()
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
        extraHeaders = JSON.parse(details.requestHeaders['x-extra-headers']) as any
      } catch {
        // noop
      }
    }
    callback({ cancel: false, requestHeaders: { ...details.requestHeaders, ...extraHeaders } })
  })
}

function setTray() {
  const icon = path.join(assetsDir, 'cat@2x.png')
  const tray = new Tray(icon)
  tray.setToolTip('Clash Config Manager')

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
      type: 'separator',
    },
    {
      type: 'normal',
      label: '更新订阅并重新生成配置',
      click() {
        mainWindow?.webContents.send('generate-force-update')
      },
    },
    {
      type: 'normal',
      label: '快捷添加规则',
      click() {
        restoreWindow()
        mainWindow?.webContents.send('add-rule')
      },
    },
    {
      type: 'separator',
    },
    {
      type: 'normal',
      label: '退出 clash-config-manager',
      click() {
        app.quit()
      },
    },
  ])
  tray.setContextMenu(contextMenu)
}

function restoreWindow() {
  mainWindow?.show()
  app.dock?.show()
}
