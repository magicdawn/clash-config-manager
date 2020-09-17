const {execSync} = require('child_process')
const path = require('path')
const pkg = require('./package.json')

const sh = (cmd) => {
  console.log('[exec]: %s', cmd)
  execSync(cmd, {stdio: 'inherit'})
}

// env
process.env.NODE_ENV = 'production'

module.exports = {
  appId: pkg.bundleId,
  productName: pkg.productName,

  directories: {
    // output: '',
  },

  files: [
    {
      from: 'bundle/${env.NODE_ENV}',
      to: '.',
    },
    'package.json',
  ],

  beforeBuild() {
    console.log('[build main]')
    sh('yarn build:main')

    console.log('[build ui]')
    sh('yarn build:ui')
  },
}
