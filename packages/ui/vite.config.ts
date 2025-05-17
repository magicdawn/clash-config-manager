import { createRequire } from 'node:module'
import path, { join } from 'node:path'
import react from '@vitejs/plugin-react'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import { defineConfig } from 'vite'
import vitePluginElectronRenderer from 'vite-plugin-electron-renderer'
import tsconfigPaths from 'vite-tsconfig-paths'

const require = createRequire(import.meta.url)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // bundle fs-extra, fs-extra.mjs 在 renderer `require('./node_modules/.vite-electron-renderer/fs-extra.cjs')`
    // 要求 electron 从 packages/ui 启动, 前端的 `process.cwd()` 是 electron 命令执行时的 cwd
    vitePluginElectronRenderer({
      resolve: {
        'fs-extra': { type: 'esm' },
      },
    }),

    tsconfigPaths({
      root: join(__dirname, '../../'),
    }),

    AutoImport({
      dts: 'src/auto-imports.d.ts',
      // targets to transform
      include: [
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
      ],
      resolvers: [
        IconsResolver({
          prefix: 'Icon',
          extension: 'jsx',
          alias: {
            // prevent `IconIconPark` double `Icon`
            'park-outline': 'icon-park-outline',
            'park-solid': 'icon-park-solid',
            'park-twotone': 'icon-park-twotone',
          },
        }),
      ],
    }),

    Icons({ compiler: 'jsx', jsx: 'react' }),

    react({
      jsxImportSource: '@emotion/react',
    }),
    UnoCSS(),
  ].filter(Boolean),

  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },

  resolve: {
    alias: {
      'monaco-themes-json-dir': path.join(path.dirname(require.resolve('monaco-themes/package')), 'themes'),
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
