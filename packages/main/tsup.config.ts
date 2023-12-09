import path from 'path'
import { defineConfig } from 'tsup'

const env = process.env.NODE_ENV || 'development'
const REPO_ROOT = path.join(__dirname, '../../')

export default defineConfig({
  entry: ['./src/index.ts'],
  format: 'esm',
  // outExtension({ format }) {
  //   return { js: '.mjs' }
  // },
  outDir: path.join(REPO_ROOT, `bundle/${env}/main/`),
  clean: true,

  platform: 'node',
  // TODO: get node version based on electron version
  // Using: Node.js v18.15.0 and Electron.js v25.3.0
  target: 'node18',

  env: {
    NODE_ENV: env,
  },

  shims: true,

  // https://github.com/evanw/esbuild/issues/1921
  banner(ctx) {
    return {
      js: `
      // BANNER START
      const require = (await import("node:module")).createRequire(import.meta.url);
      // const __filename = (await import("node:url")).fileURLToPath(import.meta.url);
      // const __dirname = (await import("node:path")).dirname(__filename);
      // BANNER END
      `,
    }
  },

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
