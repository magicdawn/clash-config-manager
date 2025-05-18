import type { BrowserWindow } from 'electron'

interface CurrentMainWindow extends BrowserWindow {
  preventClose?: () => void
  stopPreventClose?: () => void
}

declare global {
  var mainWindow: CurrentMainWindow | undefined
}
