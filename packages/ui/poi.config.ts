import path from 'path'
import merge from 'webpack-merge'
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin'
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin'
import { PoiConfig } from '@common'

const common = {
  resolve: {
    alias: {
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

const config: PoiConfig = {
  entry: 'src/index',

  devServer: {
    port: 7749,
  },

  babel: {
    // @ts-ignore
    transpileModules: [/easy-peasy/],
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
        configFile: __dirname + '/../../tsconfig.json',
      },
    },
  ],
}

export default config
