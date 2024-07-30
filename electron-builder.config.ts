import { execSync } from 'child_process'
import { type Configuration } from 'electron-builder'
import { once } from 'lodash'
import pkg from './package.json'

function defineConfig(config: Configuration) {
  return config
}

const sh = (cmd: string) => {
  console.log('[exec]: %s', cmd)
  execSync(cmd, { stdio: 'inherit' })
}

// env
process.env.NODE_ENV = 'production'

// multiarch 会调用多次 build
const buildOnce = once(function build() {
  if (process.env.SKIP_BUILD || process.argv.includes('--skip-build')) {
    return
  }

  if (!(process.env.SKIP_BUILD_MAIN || process.argv.includes('--skip-build-main'))) {
    console.log('[build main]')
    sh('pnpm build:main')
  }

  if (!(process.env.SKIP_BUILD_UI || process.argv.includes('--skip-build-ui'))) {
    console.log('[build ui]')
    sh('pnpm build:ui')
  }
})

export default defineConfig({
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

  extraResources: ['./assets/**'],

  async beforeBuild() {
    buildOnce()
  },

  async afterSign() {
    console.log('[after sign]')
    // process.nextTick(() => {
    //   const log = require('why-is-node-running').default
    //   log()
    // })
  },

  artifactName: '${productName}-${version}-${os}-${arch}.${ext}',

  mac: {
    category: 'public.app-category.developer-tools',
    publish: {
      provider: 'github',
    },
    target: [
      {
        target: 'default',
        arch: ['x64', 'arm64'],
      },
    ],
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
})
