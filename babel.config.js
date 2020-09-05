// babel.config.js
module.exports = {
  presets: [
    // Our default preset
    [
      'poi/babel',
      {
        env: {
          targets: {
            electron: '7',
          },
        },
      },
    ],
  ],

  sourceType: 'unambiguous',

  plugins: ['@babel/plugin-proposal-do-expressions'],
}
