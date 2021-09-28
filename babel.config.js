module.exports = {
  sourceType: 'unambiguous',
  presets: [
    // Our default preset
    [
      'poi/babel',
      {
        env: {
          targets: {
            electron: '11',
          },
        },
      },
    ],
  ],
}
