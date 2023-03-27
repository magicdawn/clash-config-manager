import debugFactory from 'debug'
import { session } from 'electron'
import fs from 'fs-extra'
import os from 'os'

const debug = debugFactory('ccm:dev:ext')

const loadExt = (id: string) => {
  const extDir =
    os.homedir() + `/Library/Application Support/Google/Chrome/Default/Extensions/${id}`
  if (!fs.existsSync(extDir)) return

  const ver = fs.readdirSync(extDir)[0]
  const extVerDir = extDir + '/' + ver

  debug('add %s', extVerDir)
  session.defaultSession.loadExtension(extVerDir)
}

export function load() {
  // react
  loadExt('fmkadmapgofadopljbjfkapdkoienihi')

  // redux
  loadExt('lmhkpmbekcpmknklioeibfkpmmfibljd')

  // vue
  loadExt('nhdogjmejiglipccpnnnanhbledajbpd')
}
