module.exports = {
  root: true,

  overrides: [
    {
      files: ['*.js', '*.cjs'],
      env: {
        node: true,
        es2021: true,
      },
      extends: ['eslint:recommended', 'prettier'],
      rules: {},
    },
    {
      files: ['*.mjs'],
      env: {
        node: true,
        es2021: true,
      },
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
      extends: ['eslint:recommended', 'prettier'],
      rules: {},
    },
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: [
        //
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
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
          },
        ],

        '@typescript-eslint/no-non-null-assertion': 'off',

        'react/no-unknown-property': 'off',
      },
    },
  ],

  settings: {
    react: {
      version: '18',
    },
  },
}
