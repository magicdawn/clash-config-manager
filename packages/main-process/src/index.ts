import unhandled from 'electron-unhandled'
import debug from 'electron-debug'
import contextMenu from 'electron-context-menu'
import fixPath from 'fix-path'
import './init/meta'
import './ipc/index'
import { isCli, initCommon } from './common'
import { main as mainGui } from './gui'
import { main as mainCli } from './cli'

unhandled()
debug({ showDevTools: !isCli })
contextMenu()
fixPath()
initCommon()

if (isCli) {
  mainCli()
} else {
  mainGui()
}
