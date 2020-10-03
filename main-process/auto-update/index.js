import ms from 'ms'
import {is} from 'electron-util'
import {autoUpdater} from 'electron-updater'
import electronLog from 'electron-log'

// Uncomment this before publishing your first version.
// It's commented out as it throws an error if there are no published versions.
if (!is.development) {
  autoUpdater.logger = electronLog
  autoUpdater.logger.transports.file.level = 'debug'

  setInterval(() => {
    autoUpdater.checkForUpdates()
  }, ms('4h'))
  autoUpdater.checkForUpdates()
} else {
  // autoUpdater.currentVersion = '0.2.0'
}

export async function check() {
  // return autoUpdater.checkForUpdatesAndNotify()
  return autoUpdater.checkForUpdates()
}
