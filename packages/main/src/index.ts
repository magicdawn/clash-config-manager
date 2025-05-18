import contextMenu from 'electron-context-menu'
import debug from 'electron-debug'
import unhandled from 'electron-unhandled'
import fixPath from 'fix-path'
import { initMainWindow } from './main'
import './init-meta'
import './ipc'

function initCommon() {
  unhandled()
  debug()
  contextMenu()
  fixPath()
}

initCommon()
initMainWindow()
