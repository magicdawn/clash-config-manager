import { join } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import electronRenderer from 'vite-plugin-electron/renderer'
import { viteCommonjs } from '@originjs/vite-plugin-commonjs'
import builtinModules from 'builtin-modules'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths({
      root: join(__dirname, '../../'),
    }),

    electronRenderer(),

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
    minify: false,
    outDir: join(__dirname, '../../bundle/production/renderer/'),
    emptyOutDir: true,
    rollupOptions: {
      external: [...builtinModules, 'electron'],
    },
  },
})
