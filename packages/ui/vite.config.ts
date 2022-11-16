/* eslint-disable @typescript-eslint/no-var-requires */

import { viteCommonjs } from '@originjs/vite-plugin-commonjs'
import react from '@vitejs/plugin-react'
import { set } from 'lodash'
import path, { join } from 'path'
import { defineConfig, Plugin } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// "vite-plugin-electron": "^0.4.4",
// use "vite-plugin-electron/render", 基本就是 makeRendererHappyPlugin 的逻辑

// 如果使用了 dynamic import, 会生成 defineProperty(exports, { __esModule: true })
// import polyfillExports from 'vite-plugin-electron-renderer/plugins/polyfill-exports'

import { builtinModules as __builtinModules } from 'module'
const builtinModules = __builtinModules.filter((name) => !name.startsWith('_'))

/**
 * way 1
 * optimizeDeps.exclude = [builtin modules]
 * set alias electron => make-electron-happy:electron
 * load make-electron-happy:electron with `const M = require('electron'), export {xxx}`
 * 这种方式 fs-extra > graceful-fs 报错, 只有一个 getter
 *
 * way2
 * write a esbuild plugin, load external with cjs require, do not set optimize.exclude
 * set alias electron => make-electron-happy:electron
 * load make-electron-happy:electron with `const M = require('electron'), export {xxx}`
 * esbuild plugin 只有在 pre-bundle 中生效, 非 pre-bundle 还需要 bridge code
 */

function makeRendererHappyPlugin(): Plugin {
  const happyModules = ['electron', ...builtinModules]
  const pluginName = 'make-electron-renderer-happy'
  const modulePrefix = `virtual:${pluginName}:`
  const esbuildModulePrefix = `${pluginName}__`

  return {
    name: pluginName,

    config(config, env) {
      // const isDev = env.command === 'serve'
      const isBuild = env.command === 'build'

      // for embed deployment
      set(config, 'base', config.base || './')

      const filter = new RegExp(`^(${happyModules.join('|')})$`)
      // const filterWithPrefix = new RegExp(`^${esbuildModulePrefix}(${happyModules.join('|')})$`)

      config.optimizeDeps = config.optimizeDeps ?? {}
      config.optimizeDeps.esbuildOptions = config.optimizeDeps.esbuildOptions ?? {}
      config.optimizeDeps.include = [
        ...(config.optimizeDeps.include ?? []),
        // ...happyModules.map((m) => esbuildModulePrefix + m),
      ]
      config.optimizeDeps.esbuildOptions.plugins = [
        ...(config.optimizeDeps.esbuildOptions.plugins || []),
        {
          name: pluginName + ':esbuild',
          setup(build) {
            // without prefix
            build.onResolve({ filter }, (args) => {
              return {
                path: args.path,
                namespace: pluginName,
                external: true,
              }
            })
            build.onLoad({ filter, namespace: pluginName }, (args) => {
              return {
                contents: `module.exports = require("${args.path}")`,
              }
            })

            // build.onResolve({ filter: filterWithPrefix }, (args) => {
            //   return {
            //     path: args.path,
            //     namespace: pluginName,
            //   }
            // })
            // build.onLoad({ filter: filterWithPrefix, namespace: pluginName }, (args) => {
            //   const moduleRaw = args.path.slice(esbuildModulePrefix.length)
            //   return {
            //     contents: `module.exports = require("${moduleRaw}")`,
            //   }
            // })
          },
        },
      ]

      // set(config, 'optimizeDeps.exclude', [
      //   ...(config.optimizeDeps?.exclude || []),
      //   ...happyModules,
      // ])

      // 设置 alias, 提供 bridge virtual module
      const alias: Record<string, string> = {}
      for (const name of happyModules) {
        alias[name] = modulePrefix + name
      }
      set(config, 'resolve.alias', { ...config.resolve?.alias, ...alias })

      if (isBuild) {
        // rollup cjs ignore ----
        const ignore = config.build?.commonjsOptions?.ignore
        let newIgnore = ignore
        if (ignore) {
          if (typeof ignore === 'function') {
            newIgnore = (id) => {
              if (happyModules.includes(id)) return true
              return ignore(id)
            }
          } else {
            newIgnore = [...ignore, ...happyModules]
          }
        } else {
          newIgnore = [...happyModules]
        }
        set(config, 'build.commonjsOptions.ignore', newIgnore)
      }
    },

    resolveId(id) {
      if (id.startsWith(modulePrefix)) return '\0' + id
    },

    load(id) {
      const getModuleCode = (m: string) => {
        if (m === 'electron') {
          return `
          const M = require("electron");
          const {
            clipboard,
            nativeImage,
            shell,
            contextBridge,
            crashReporter,
            ipcRenderer,
            webFrame,
            desktopCapturer,
            deprecate,
          } = M;

          export default M
          export {
            clipboard,
            nativeImage,
            shell,
            contextBridge,
            crashReporter,
            ipcRenderer,
            webFrame,
            desktopCapturer,
            deprecate,
          }
          `
        }

        if (builtinModules.includes(m)) {
          const M = require(`node:${m}`)
          const namedExports = Object.keys(M).filter((name) => !name.startsWith('_'))
          const namedExportsStr = namedExports.join(',\n')

          return `
            const M = require('${m}')
            const {
              ${namedExportsStr}
            } = M

            export default M
            export {
              ${namedExportsStr}
            }
          `
        }
      }

      // make-electron-happy:crypto
      if (id.startsWith('\0' + modulePrefix)) {
        // console.log(id)
        const m = id.slice(1 + modulePrefix.length)
        return getModuleCode(m)
        // return `module.exports = require('${m}')`
        // return `export default require('${m}')`
      }
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tsconfigPaths({
      root: join(__dirname, '../../'),
    }),

    react(),

    /**
     * make vite + electron happy
     */
    // electronRendererPlugin({
    //   nodeIntegration: true,
    //   optimizeDeps: {
    //     include: [
    //       { name: 'env-paths', type: 'module' },
    //     ],
    //   },
    // }),
    makeRendererHappyPlugin(),

    // polyfillExports(),
    // https://github.com/vitejs/vite/issues/3409
    viteCommonjs({
      include: ['react-command-palette'],
    }),
  ].filter(Boolean),

  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },

  resolve: {
    alias: {
      'monaco-themes-json-dir': path.join(
        path.dirname(require.resolve('monaco-themes/package')),
        'themes'
      ),
    },
  },

  /**
   * dev
   */
  optimizeDeps: {
    esbuildOptions: {
      logLevel: 'info',
    },
    // force: true,
  },
  server: {
    port: 7749,
  },

  /**
   * prod
   */
  preview: {
    port: 7749,
  },
  build: {
    target: 'modules',
    minify: false,
    outDir: join(__dirname, '../../bundle/production/renderer/'),
    emptyOutDir: true,
  },
})
