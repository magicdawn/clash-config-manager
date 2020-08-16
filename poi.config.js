const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')

module.exports = {
  entry: 'src/index.js',

  devServer: {
    port: 7749,
  },

  output: {
    target: 'electron-renderer',
  },

  configureWebpack(config) {
    if (process.env.NODE_ENV === 'development') {
      config.plugins.push(new ReactRefreshWebpackPlugin())
    }

    return config
  },
}
