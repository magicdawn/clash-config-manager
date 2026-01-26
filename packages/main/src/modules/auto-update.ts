import bytes from 'bytes'
import debugFactory from 'debug'
import electronLog from 'electron-log'
import { autoUpdater } from 'electron-updater'
import { isDev } from 'electron-util/main'
import { throttle } from 'es-toolkit'
import ms from 'ms'
import { mainWindow } from '$main/main-window'
import setMenu from './menu'

const debug = debugFactory('ccm:auto-update')

const menuItem = {
  check: {
    label: '检查更新',
    click() {
      check()
    },
  },

  downloading: {
    label: '下载中',
    enabled: false,
    click() {
      // noop
    },
  },

  downloaded: {
    label: '更新已下载, 重启生效',
    click() {
      debug('quit and install')

      // remove preventClose listener
      mainWindow?.stopPreventClose?.()

      setImmediate(() => autoUpdater.quitAndInstall())
    },
  },
}

export let updateMenuItem = menuItem.check

const setDownloadingMenu = throttle((progressObj) => {
  const { bytesPerSecond, percent, total, transferred } = progressObj

  const currentMenuItem = {
    ...menuItem.downloading,
    label: `更新下载中 速度 ${bytes(bytesPerSecond)}/s ${bytes(transferred)}/${bytes(total)} ${percent.toFixed(0)}%`,
  }
  updateMenuItem = currentMenuItem
  setMenu()
}, 1000)

autoUpdater.on('download-progress', (progressObj) => {
  setDownloadingMenu(progressObj)
})

autoUpdater.on('update-downloaded', (info) => {
  setDownloadingMenu.cancel()
  updateMenuItem = menuItem.downloaded
  setMenu()
})

export async function check() {
  try {
    if (isDev) {
      return await autoUpdater.checkForUpdates()
    } else {
      return await autoUpdater.checkForUpdatesAndNotify()
    }
  } catch (e) {
    console.error('[auto-update] check update error')
    console.error(e.stack || e)
  }
}

if (!isDev) {
  autoUpdater.logger = electronLog
  // @ts-ignore
  autoUpdater.logger.transports.file.level = 'debug'
  // @ts-ignore
  autoUpdater.logger.transports.console.level = 'debug'

  // per day check
  setInterval(() => {
    check()
  }, ms('1d'))

  // 10s after startup
  setTimeout(() => {
    check()
  }, ms('10s'))
} else {
  // @ts-ignore
  // autoUpdater.currentVersion = '0.2.0'
  // autoUpdater.checkForUpdates()
}
