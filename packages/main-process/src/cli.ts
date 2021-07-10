import path from 'path'
import {app, BrowserWindow} from 'electron'
import minimist from 'minimist'

// Prevent window from being garbage collected
let mainWindow: BrowserWindow

import './init/meta'
import {loadWindowState} from './initWindowState'
import './ipc/index'

// hide dock
app.dock.hide()

const argv = minimist(process.argv, {
  alias: {
    h: 'help',
    v: 'version',
  },
})
console.log('argv = ', argv)

async function main() {
  await app.whenReady()
  mainWindow = await createMainWindow()
  if (process.env.NODE_ENV === 'production') {
    await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  } else {
    await mainWindow.loadURL('http://localhost:7749')
  }
}

async function createMainWindow() {
  const {bounds} = await loadWindowState()

  const win = new BrowserWindow({
    title: app.name,
    show: false,
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
    },
  })

  win.on('ready-to-show', () => {
    win.hide()
  })

  return win
}
