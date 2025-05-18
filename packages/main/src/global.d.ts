import type { BrowserWindow } from 'electron'

declare global {
  var mainWindow: BrowserWindow | undefined
}
