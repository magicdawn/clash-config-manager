import path from 'path'
import merge from 'webpack-merge'
import { PoiConfig } from '../common/src'
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin'

const common = {
  resolve: {
    alias: {},

    plugins: [
      // tsconfig
      new TsconfigPathsPlugin({
        configFile: __dirname + '/../../tsconfig.json',
      }),
    ],
  },
}

const dev = {}
const prod = {}

const config: PoiConfig = {
  entry: './src/',

  babel: {
    transpileModules: [],
  },

  output: {
    target: 'electron-main',
    format: 'cjs',
    // minimize: false,
    dir: path.join(__dirname, '../../', 'bundle', process.env.NODE_ENV, 'main'),
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

export default config
