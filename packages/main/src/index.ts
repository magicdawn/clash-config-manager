import './modules/init-meta'
import path from 'node:path'
import { app, Menu, session, Tray } from 'electron'
import contextMenu from 'electron-context-menu'
import debug from 'electron-debug'
import ElectronStore from 'electron-store'
import unhandled from 'electron-unhandled'
import { is } from 'electron-util'
import fixPath from 'fix-path'
import { initMainWindow, mainWindow } from './main-window'
import { loadDevtoolExtensions } from './modules/devtool-extensions'
import { assetsDir } from './modules/ipc/common'
import setMenu from './modules/menu'

main()
async function main() {
  // Prevent multiple instances of the app
  if (!app.requestSingleInstanceLock()) {
    app.quit()
    return
  }

  /* #region general helpers */
  unhandled()
  debug()
  contextMenu()
  fixPath()
  /* #endregion */

  initAppEvents()
  ElectronStore.initRenderer()
  await Promise.all([
    //
    import('./modules/fix-paste'),
    import('./modules/ipc'),
    app.whenReady(),
  ])

  // 需要 app.ready: menu | tray | session.defaultSession
  setMenu()
  setTray()
  addRequestExtraHeadersSupport()
  await loadDevtoolExtensions()

  await initMainWindow()
}

function initAppEvents() {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    mainWindow.show()
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
