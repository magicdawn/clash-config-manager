import os from 'node:os'
import debugFactory from 'debug'
import { session } from 'electron'
import fs from 'fs-extra'

const debug = debugFactory('ccm:dev:ext')

async function loadExt(id: string) {
  const extDir = `${os.homedir()}/Library/Application Support/Google/Chrome/Default/Extensions/${id}`
  if (!(await fs.exists(extDir))) return

  const ver = (await fs.readdir(extDir))[0]
  const extVerDir = `${extDir}/${ver}`

  debug('add %s', extVerDir)
  return session.defaultSession.extensions.loadExtension(extVerDir, { allowFileAccess: true })
}

export function loadDevtoolExtensions() {
  const ids = [
    'fmkadmapgofadopljbjfkapdkoienihi', // react-devtools
    'lmhkpmbekcpmknklioeibfkpmmfibljd', // redux
  ]
  return Promise.all(ids.map((id) => loadExt(id)))
}
