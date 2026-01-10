import './modules/init-meta'
import './modules/fix-paste'
import './modules/ipc'
import contextMenu from 'electron-context-menu'
import debug from 'electron-debug'
import unhandled from 'electron-unhandled'
import fixPath from 'fix-path'
import { initMainWindow } from './main-window'

void (function () {
  unhandled()
  debug()
  contextMenu()
  fixPath()
  initMainWindow()
})()
