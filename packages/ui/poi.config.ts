import path from 'path'
import merge from 'webpack-merge'
import {Config} from 'poi'
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin'
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin'
import xDeps from '@magicdawn/x/deps'

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

      'easy-peasy': require.resolve('easy-peasy/src/index'),
    },

    plugins: [
      // tsconfig
      new TsconfigPathsPlugin({
        configFile: __dirname + '/../../tsconfig.json',
      }),
    ],
  },

  plugins: [
    // monaco
    new MonacoWebpackPlugin({
      // available options are documented at https://github.com/Microsoft/monaco-editor-webpack-plugin#options
      languages: ['json', 'javascript', 'yaml'],
    }),
  ],
}

const dev = {}
const prod = {}

type PoiConfig = import('poi').Config & {reactRefresh?: boolean}
const config: PoiConfig = {
  entry: 'src/index',

  devServer: {
    port: 7749,
  },

  babel: {
    // @ts-ignore
    transpileModules: ['@magicdawn/x', /easy-peasy/],
  },

  output: {
    target: 'electron-renderer',
    publicUrl: './',
    dir: path.join(__dirname, '../../', 'bundle', process.env.NODE_ENV, 'renderer'),
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
      options: {
        lintOnSave: false,
        babel: false,
      },
    },
  ],
}

export default config
