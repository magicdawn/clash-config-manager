import path from 'path'
import { defineConfig } from 'tsup'

process.env.NODE_ENV = process.env.NODE_ENV || 'development'
const env = process.env.NODE_ENV
const REPO_ROOT = path.join(__dirname, '../../')

export default defineConfig({
  entry: ['./src/index.ts'],
  format: 'cjs',
  outDir: path.join(REPO_ROOT, `bundle/${env}/main/`),
  platform: 'node',

  // TODO: get node version based on electron version
  // Using: Node.js v18.15.0 and Electron.js v25.3.0
  target: 'node18',

  // NOTE: 此处 external & noExternal 只是输入给 esbuild.options({ plugins: [externalPlugin] })
  // 无法做到, bundle any dep, except `electron`
  // 直接使用 `esbuildOptions.external` 则 esbuild.onResolve / onLoad 逻辑都不会走
  // external: ['electron'],
  noExternal: [/.*/],

  esbuildOptions(options, context) {
    options.charset = 'utf8'
    options.external ||= []
    options.external.push('electron')
  },
})
