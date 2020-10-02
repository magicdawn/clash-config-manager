const path = require('path')
const merge = require('webpack-merge')
const xDeps = require('@magicdawn/x/deps')

const common = {
  resolve: {
    alias: {
      // make it short
      '@x': '@magicdawn/x',

      // when npmlink @magicdawn/x
      ...xDeps.reduce((o, m) => {
        o[m] = path.join(__dirname, 'node_modules', m)
        return o
      }, {}),
    },
  },
  plugins: [],

  externals: {
    'cliui': 'commonjs2 cliui',
    'y18n': 'commonjs2 y18n',
    'yargs-parser': 'commonjs2 yargs-parser',
  },
}

const dev = {}

const prod = {}

module.exports = {
  entry: './main-process/index.js',

  babel: {
    transpileModules: ['@magicdawn/x'],
  },

  output: {
    target: 'electron-main',
    format: 'cjs',
    // minimize: false,
    dir: path.join(__dirname, 'bundle', process.env.NODE_ENV, 'main'),
  },

  configureWebpack(config) {
    config.node = {
      global: false,
      __dirname: false,
      __filename: false,
    }

    if (process.env.NODE_ENV === 'production') {
      return merge(config, common, prod)
    } else {
      return merge(config, common, dev)
    }
  },
}
