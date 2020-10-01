const os = require('os')
const fs = require('fs-extra')
const {BrowserWindow} = require('electron')
const debugFactory = require('debug')
const debug = debugFactory('ccm:dev:ext')

const load = (id) => {
  const extDir =
    os.homedir() + `/Library/Application Support/Google/Chrome/Default/Extensions/${id}`
  if (!fs.existsSync(extDir)) return

  const ver = fs.readdirSync(extDir)[0]
  const extVerDir = extDir + '/' + ver

  debug('add %s', extVerDir)
  BrowserWindow.addDevToolsExtension(extVerDir)
}

exports.load = () => {
  // react
  load('fmkadmapgofadopljbjfkapdkoienihi')

  // redux
  load('lmhkpmbekcpmknklioeibfkpmmfibljd')

  // vue
  load('nhdogjmejiglipccpnnnanhbledajbpd')
}
