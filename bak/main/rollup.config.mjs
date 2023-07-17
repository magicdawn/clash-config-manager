import { dirname, join } from 'path'
import { defineConfig } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import esbuild from 'rollup-plugin-esbuild'
import tsconfigPaths from 'rollup-plugin-tsconfig-paths'
import replace from '@rollup/plugin-replace'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

process.env.NODE_ENV = process.env.NODE_ENV || 'development'
const env = process.env.NODE_ENV
const APP_ROOT = join(__dirname, '../../')
const tsconfig = APP_ROOT + '/tsconfig.json'

export default defineConfig({
  input: join(__dirname, './src/index.ts'),
  output: {
    dir: `${APP_ROOT}/bundle/${env}/main`,
    format: 'cjs',
  },

  external: ['electron', 'fs/promises'],

  onwarn: function (message) {
    if (['CIRCULAR_DEPENDENCY'].includes(message.code)) return
    console.error(message)
  },

  plugins: [
    tsconfigPaths({ tsConfigPath: tsconfig }),
    nodeResolve({
      browser: false, // build for electron-main
      preferBuiltins: true, // external builtin modules
    }),
    json(),
    commonjs(),
    esbuild({ tsconfig }),
    replace({
      'preventAssignment': true,
      'process.env.NODE_ENV': JSON.stringify(env),
    }),
  ],
})
