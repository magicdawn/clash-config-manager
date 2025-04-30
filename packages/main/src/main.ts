import * as remoteMain from '@electron/remote/main'
import { app, BrowserWindow, Menu, session, shell, Tray, type Event } from 'electron'
import { is } from 'electron-util'
import { throttle } from 'es-toolkit'
import path from 'path'
import { load as loadDevExt } from './dev/ext'
import './init/meta'
import { loadWindowState, saveWindowState } from './initWindowState'
import { assetsDir } from './ipc/common'
import './ipc/index'
import setMenu from './menu'

// Prevent window from being garbage collected
export let mainWindow: BrowserWindow

export async function main() {
  initAppEvents()
  await app.whenReady()

  addRequestExtraHeadersSupport()
  setMenu()
  setTray()
  loadDevExt()

  mainWindow = await createMainWindow()
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

  const saveWindowStateHandler = throttle(() => {
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
    if (!hasVisibleWindows) {
      restoreWindow()
    }
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
        extraHeaders = JSON.parse(details.requestHeaders['x-extra-headers']) as any
      } catch (e) {
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
