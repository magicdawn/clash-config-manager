const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')

module.exports = {
  entry: 'src/index.js',

  devServer: {
    port: 7749,
  },

  babel: {
    transpileModules: ['@x'],
  },

  output: {
    target: 'electron-renderer',
  },

  reactRefresh: true,

  // configureWebpack(config) {
  //   return config
  // },
}
