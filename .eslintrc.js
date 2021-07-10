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
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    __dirname + '/.eslintrc.yml',
    'prettier',
  ],

  rules: {
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',

    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        args: 'none',
        ignoreRestSiblings: true,
        varsIgnorePattern: unused.join('|'),
      },
    ],
  },
}
