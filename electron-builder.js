const {execSync} = require('child_process')
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
    './package.json',
  ],

  extraResources: [
    {
      from: './main-process/bin/clash-config-manager.sh',
      to: '.',
    },
  ],

  beforeBuild() {
    console.log('[build main]')
    sh('yarn build:main')

    console.log('[build ui]')
    sh('yarn build:ui')
  },

  mac: {
    category: 'public.app-category.developer-tools',
    target: ['dmg'],
  },

  dmg: {
    iconSize: 160,
    contents: [
      {
        x: 180,
        y: 170,
      },
      {
        x: 480,
        y: 170,
        type: 'link',
        path: '/Applications',
      },
    ],
  },
}
