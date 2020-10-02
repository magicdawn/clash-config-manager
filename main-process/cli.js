import path from 'path'
import {app, BrowserWindow} from 'electron'
import pkg from '../package.json'

// Prevent window from being garbage collected
let mainWindow

import './init/meta'
import {loadWindowState} from './initWindowState'
import './ipc/index'
import yargs from 'yargs'

// hide dock
app.dock.hide()

yargs
  .scriptName('ccm')
  .command({
    command: 'generate',
    desc: 'generate config file',
    aliases: ['g'],
    builder: (yargs) => {
      return yargs.options({
        force: {
          type: 'boolean',
          desc: 'forceUpdate ?',
        },
      })
    },
    handler(argv) {
      main(argv)
    },
  })
  .alias({
    h: 'help',
    v: 'version',
  })
  .version(pkg.version)
  .help().argv

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
