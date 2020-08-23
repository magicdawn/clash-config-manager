const path = require('path')
const os = require('os')
const fs = require('fs-extra')
const {BrowserWindow} = require('electron')

const load = (id) => {
  const extDir = os.homedir() + `/Library/ApplicationSupport/Google/Chrome/Default/Extensions/${id}`
  if (!fs.existsSync(extDir)) return

  const ver = fs.readdirSync(extDir)[0]
  const extVerDir = extDir + '/' + ver

  console.log('add %s', extVerDir)
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
