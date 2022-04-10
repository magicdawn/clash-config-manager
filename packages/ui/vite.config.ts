import { join } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import electronRenderer from 'vite-plugin-electron/renderer'
import { viteCommonjs } from '@originjs/vite-plugin-commonjs'

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
  ],

  server: {
    port: 7749,
  },

  optimizeDeps: {
    esbuildOptions: {
      logLevel: 'info',
    },
  },
})
