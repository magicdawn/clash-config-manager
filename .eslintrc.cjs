const unused = [
  // react
  'React',
  'useState',
  'useEffect',
  'useCallback',
  'useRef',
  'useImperativeHandle',

  // ahooks
  'useMemoizedFn',
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
    'prefer-const': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-empty-function': 'off',

    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        args: 'none',
        ignoreRestSiblings: true,
        varsIgnorePattern: unused.join('|'),
      },
    ],

    '@typescript-eslint/no-non-null-assertion': 'off',
  },

  overrides: [
    {
      files: ['*.js'],
      parser: 'babel-eslint',
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
}
