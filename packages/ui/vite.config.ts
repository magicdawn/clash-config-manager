/* eslint-disable @typescript-eslint/no-var-requires */

import { viteCommonjs } from '@originjs/vite-plugin-commonjs'
import react from '@vitejs/plugin-react'
import { join } from 'path'
import { defineConfig, Plugin } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { set } from 'lodash'

// "vite-plugin-electron": "^0.4.4",
// use "vite-plugin-electron/render", 基本就是 makeRendererHappyPlugin 的逻辑

// 如果使用了 dynamic import, 会生成 defineProperty(exports, { __esModule: true })
import polyfillExports from 'vite-plugin-electron-renderer/plugins/polyfill-exports'

import { builtinModules as __builtinModules } from 'module'
const builtinModules = __builtinModules.filter((name) => !name.startsWith('_'))

function makeRendererHappyPlugin(): Plugin {
  const happyModules = ['electron', ...builtinModules]
  const name = 'make-electron-renderer-happy'
  const modulePrefix = `virtual:${name}:`

  return {
    name,

    config(config, env) {
      // const isDev = env.command === 'serve'
      const isBuild = env.command === 'build'

      set(config, 'optimizeDeps.exclude', [
        ...(config.optimizeDeps?.exclude || []),
        ...happyModules,
      ])

      // for embed deployment
      set(config, 'base', config.base || './')

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
      if (id.startsWith(modulePrefix)) {
        // console.log(id)
        const m = id.slice(modulePrefix.length)
        const code = getModuleCode(m)
        if (code) return code
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

    // electronRenderer(),
    makeRendererHappyPlugin(),
    polyfillExports(),
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

  /**
   * dev
   */
  optimizeDeps: {
    esbuildOptions: {
      logLevel: 'info',
    },
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
