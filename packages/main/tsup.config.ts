import { randomUUID } from 'crypto'
import { camelCase } from 'es-toolkit'
import { builtinModules } from 'module'
import path from 'path'
import { defineConfig } from 'tsup'

const env = process.env.NODE_ENV || 'development'
const REPO_ROOT = path.join(import.meta.dirname, '../../')

const nsp = randomUUID()
const prefix = randomUUID()

export default defineConfig({
  entry: ['./src/index.ts'],
  format: 'esm',
  outExtension: () => ({ js: '.mjs', dts: '.d.mts' }),
  outDir: path.join(REPO_ROOT, `bundle/${env}/main/`),
  clean: true,

  platform: 'node',
  // TODO: get node version based on electron version
  // Using: Node.js v18.15.0 and Electron.js v25.3.0
  target: 'node18',

  env: {
    NODE_ENV: env,
  },

  // NOTE: 此处 external & noExternal 只是输入给 esbuild.options({ plugins: [externalPlugin] })
  // 无法做到, bundle any dep, except `electron`
  // 直接使用 `esbuildOptions.external` 则 esbuild.onResolve / onLoad 逻辑都不会走
  noExternal: [/.*/],

  esbuildOptions(options, context) {
    options.charset = 'utf8'
    options.external ||= []
    // options.external.push('electron')
  },

  esbuildPlugins: [
    // esbuild doesn't transpile `require('foo')` into `import` statements if 'foo' is externalized
    // https://github.com/evanw/esbuild/issues/566#issuecomment-735551834
    // https://github.com/vitejs/vite/blob/main/packages/vite/src/node/optimizer/esbuildDepPlugin.ts#L300
    {
      name: 'custom-external-plugin',
      setup(build) {
        const filter = new RegExp(
          ['electron', ...builtinModules.map((x) => [x, `node\\:${x}`]).flat()]
            .map((id) => `(?:^${id}$)`)
            .join('|'),
        )
        // console.log(filter)

        build.onResolve({ filter }, (args) => {
          if (args.kind === 'require-call') {
            return {
              path: args.path,
              namespace: nsp,
            }
          }
          return {
            path: args.path,
            external: true,
          }
        })

        build.onLoad({ filter: /.*/, namespace: nsp }, (args) => {
          const m = camelCase(args.path).replace(/[:/]/g, '_')
          return {
            contents: `
              import ${m} from ${JSON.stringify(prefix + args.path)};
              module.exports = ${m};
            `,
          }
        })

        build.onResolve({ filter: new RegExp(`^${prefix}`) }, (args) => {
          return {
            path: args.path.slice(prefix.length),
            external: true,
          }
        })
      },
    },
  ],
})
