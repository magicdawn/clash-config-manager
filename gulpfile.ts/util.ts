import minimist from 'minimist'
import log from 'fancy-log'
import {execSync} from 'child_process'
import path from 'path'

export const argv = minimist(process.argv.slice(2))
export const PROJECT_ROOT = path.join(__dirname, '..')

export const sh = (cmd: string) => {
  log('[exec]: %s', cmd)
  if (argv['dry-run']) {
    // just print
  } else {
    execSync(cmd, {stdio: 'inherit'})
  }
}
