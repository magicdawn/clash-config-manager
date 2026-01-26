import path from 'node:path'
import { findUpSync } from 'find-up-simple'
import { defineConfig } from 'tsdown'

const env = process.env.NODE_ENV || 'development'
const REPO_ROOT = path.dirname(findUpSync('pnpm-workspace.yaml', { cwd: import.meta.dirname })!)

export default defineConfig({
  entry: ['./src/index.ts'],
  format: 'esm',
  outDir: path.join(REPO_ROOT, `bundle/${env}/main/`),
  clean: true,
  platform: 'node',
  // TODO: get node version based on electron version, output from `pnpm electron -i`
  target: 'node24',
  env: { NODE_ENV: env },
  external: ['electron'],
  noExternal: [/.*/],
  inlineOnly: false, // false: Suppress all warnings about inlineOnly option.
})
