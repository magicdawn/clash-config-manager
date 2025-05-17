//
import contextMenu from 'electron-context-menu'
import debug from 'electron-debug'

import unhandled from 'electron-unhandled'
import fixPath from 'fix-path'
import { main } from './main'
// init
import './init/meta'
import './ipc/index'

unhandled()
debug()
contextMenu()
fixPath()

main()
