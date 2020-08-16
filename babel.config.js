// babel.config.js
module.exports = (api) => {
  return {
    presets: [
      // Our default preset
      'poi/babel',
    ],
    plugins: [
      // This adds Hot Reloading support
      // 'react-hot-loader/babel',
      !api.env('production') && 'react-refresh/babel',
    ],
  }
}
