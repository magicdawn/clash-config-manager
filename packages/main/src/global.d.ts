import type { BrowserWindow } from 'electron'
export {}

declare global {
  var mainWindow: BrowserWindow | undefined
}
