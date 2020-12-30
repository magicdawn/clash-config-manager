import path from 'path'
import {Config} from 'poi'
import merge from 'webpack-merge'
import xDeps from '@magicdawn/x/deps'
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin'

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

  plugins: [
    new MonacoWebpackPlugin({
      // available options are documented at https://github.com/Microsoft/monaco-editor-webpack-plugin#options
      languages: ['json', 'javascript', 'yaml'],
    }),
  ],
}

const dev = {}

const prod = {}

// console.log(common)

const config: Config & {reactRefresh: boolean} = {
  entry: 'src/index',

  devServer: {
    port: 7749,
  },

  babel: {
    transpileModules: ['@magicdawn/x'],
  },

  output: {
    target: 'electron-renderer',
    publicUrl: './',
    // minimize: false,
    dir: path.join(__dirname, 'bundle', process.env.NODE_ENV, 'renderer'),
  },

  reactRefresh: true,

  configureWebpack(config) {
    if (process.env.NODE_ENV === 'production') {
      return merge(config, common, prod)
    } else {
      return merge(config, common, dev)
    }
  },

  plugins: [
    {
      resolve: '@poi/plugin-typescript',
      options: {},
    },
  ],
}

export default config
