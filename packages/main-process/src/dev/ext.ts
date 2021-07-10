import os from 'os'
import fs from 'fs-extra'
import {BrowserWindow} from 'electron'
import debugFactory from 'debug'

const debug = debugFactory('ccm:dev:ext')

const loadExt = (id: string) => {
  const extDir =
    os.homedir() + `/Library/Application Support/Google/Chrome/Default/Extensions/${id}`
  if (!fs.existsSync(extDir)) return

  const ver = fs.readdirSync(extDir)[0]
  const extVerDir = extDir + '/' + ver

  debug('add %s', extVerDir)
  BrowserWindow.addDevToolsExtension(extVerDir)
}

export function load() {
  // react
  loadExt('fmkadmapgofadopljbjfkapdkoienihi')

  // redux
  loadExt('lmhkpmbekcpmknklioeibfkpmmfibljd')

  // vue
  loadExt('nhdogjmejiglipccpnnnanhbledajbpd')
}
