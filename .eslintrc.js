const unused = [
  // react
  'React',
  'useState',
  'useEffect',
  'useCallback',
  'useRef',
  'useImperativeHandle',

  // ahooks
  'usePersistFn',
  'useMount',
  'useUpdateEffect',

  // plug
  'usePlug',

  // antd
  'message',
  'Button',
]

module.exports = {
  extends: __dirname + '/.eslintrc.yml',
  rules: {
    'no-unused-vars': [
      'warn',
      {
        args: 'none',
        ignoreRestSiblings: true,
        varsIgnorePattern: unused.join('|'),
      },
    ],
  },
}
