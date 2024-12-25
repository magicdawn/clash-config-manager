/* eslint-disable @typescript-eslint/no-var-requires */

import react from '@vitejs/plugin-react'
import esmUtils from 'esm-utils'
import path, { join } from 'path'
import Icons from 'unplugin-icons/vite'
import { defineConfig, mergeConfig, type Plugin, type UserConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import UnoCSS from 'unocss/vite'

const { require } = esmUtils(import.meta)

// "vite-plugin-electron": "^0.4.4",
// use "vite-plugin-electron/render", 基本就是 makeRendererHappyPlugin 的逻辑

// 如果使用了 dynamic import, 会生成 defineProperty(exports, { __esModule: true })
// import polyfillExports from 'vite-plugin-electron-renderer/plugins/polyfill-exports'

import { builtinModules as __builtinModules } from 'module'
const builtinModules = __builtinModules.filter((name) => !name.startsWith('_'))

/**
 * this plugin does nothing, 花里胡哨, 没用
 * https://github.com/alex8088/electron-vite/blob/v2.2.0/src/plugins/electron.ts#L330
 */

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

function makeRendererHappyPlugins(): Plugin[] {
  const happyModules = ['electron', ...builtinModules, ...builtinModules.map((x) => `node:${x}`)]
  const pluginName = 'make-electron-renderer-happy'
  const modulePrefix = `virtual:${pluginName}:`
  const esbuildModulePrefix = `${pluginName}__`

  return [
    {
      name: `${pluginName}:optimizeDeps`,
      config(config, env) {
        // init if empty
        config.optimizeDeps ||= {}
        config.optimizeDeps.include ||= []
        config.optimizeDeps.exclude ||= []
        config.optimizeDeps.esbuildOptions ||= {}
        config.optimizeDeps.esbuildOptions.plugins ||= []

        // config.optimizeDeps.exclude.push(...happyModules)

        const filter = new RegExp(`^(${happyModules.join('|')})$`)

        config.optimizeDeps.esbuildOptions.plugins.push({
          name: `${pluginName}:optimizeDeps:esbuild`,
          setup(build) {
            // without prefix
            build.onResolve({ filter }, (args) => {
              // console.log('esbuild onResolve %s', args.path)
              return {
                path: args.path,
                namespace: pluginName,
                external: true,
              }
            })
            build.onLoad({ filter, namespace: pluginName }, (args) => {
              // console.log('esbuild onLoad %s', args.path)
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
        })
      },
    },

    {
      name: pluginName,

      config(config, env) {
        let ret: UserConfig = {}
        const setConfig = (config: UserConfig) => {
          ret = mergeConfig(ret, config)
        }

        const isBuild = env.command === 'build'

        // for embed deployment
        setConfig({ base: './' })

        // 设置 alias, 提供 bridge virtual module
        const alias: Record<string, string> = {}
        for (const name of happyModules) {
          alias[name] = modulePrefix + name
        }
        setConfig({ resolve: { alias } })

        if (isBuild) {
          // rollup cjs ignore
          setConfig({
            build: {
              commonjsOptions: {
                ignore: happyModules,
              },
            },
          })
        }

        return ret
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

          if (m.startsWith('node:')) {
            m = m.slice('node:'.length)
          }
          if (builtinModules.includes(m)) {
            const M = require(`node:${m}`)
            const namedExports = Object.keys(M).filter((name) => !name.startsWith('_'))
            const namedExportsStr = namedExports.join(',\n  ')

            const code = `
            const M = require('${m}')
            const {
              ${namedExportsStr}
            } = M

            export default M
            export {
              ${namedExportsStr}
            }
          `

            return alignTrim(code)
          }
        }

        // make-electron-happy:crypto
        if (id.startsWith('\0' + modulePrefix)) {
          // console.log(id)
          const m = id.slice(('\0' + modulePrefix).length)
          return getModuleCode(m)
          // return `module.exports = require('${m}')`
          // return `export default require('${m}')`
        }
      },
    },
  ]
}

function alignTrim(s: string) {
  let lines = s.split('\n')

  const getIndentOfLine = (line: string) => line.length - line.trimStart().length
  const firstLine = lines.find((l) => Boolean(l.trim()))
  if (firstLine) {
    const firstLineIndent = getIndentOfLine(firstLine)
    if (firstLineIndent) {
      lines = lines.map((line) => {
        const indent = getIndentOfLine(line)
        if (indent >= firstLineIndent) {
          line = line.slice(firstLineIndent)
        }
        return line
      })
    }
  }

  return lines.join('\n')
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tsconfigPaths({
      root: join(__dirname, '../../'),
    }),

    Icons({ compiler: 'jsx', jsx: 'react' }),

    react({
      jsxImportSource: '@emotion/react',
    }),
    UnoCSS(),

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
    ...makeRendererHappyPlugins(),
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
        'themes',
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
