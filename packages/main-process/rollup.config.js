import { defineConfig } from 'rollup'
import { join } from 'path'

import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import esbuild from 'rollup-plugin-esbuild'
import tsconfigPaths from 'rollup-plugin-tsconfig-paths'

process.env.NODE_ENV = process.env.NODE_ENV || 'development'
const env = process.env.NODE_ENV
const APP_ROOT = join(__dirname, '../../')
const tsconfig = APP_ROOT + '/tsconfig.json'

export default defineConfig({
  input: join(__dirname, './src/index.ts'),

  plugins: [
    tsconfigPaths({ tsConfigPath: tsconfig }),
    nodeResolve({
      browser: false, // build for electron-main
      preferBuiltins: true, // external builtin modules
    }),
    json(),
    commonjs(),
    esbuild({ tsconfig }),
  ],

  external: ['electron', 'fs/promises'],

  output: {
    dir: `${APP_ROOT}/bundle/${env}/main`,
    format: 'cjs',
  },
})
