import { execSync } from 'node:child_process'
import path from 'node:path'
import log from 'fancy-log'
import minimist from 'minimist'

export const argv = minimist(process.argv.slice(2))
export const PROJECT_ROOT = path.join(__dirname, '..')

export const sh = (cmd: string, { silent = false }: { silent?: boolean } = {}) => {
  if (!silent) log('[exec]: %s', cmd)
  if (argv['dry-run']) {
    // just print
  } else {
    execSync(cmd, { stdio: 'inherit' })
  }
}
