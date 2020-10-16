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

export interface TaskMeta {
  description?: string
  flags?: Object
  displayName?: string
  run: () => Promise<void>
}

export function task(data: TaskMeta) {
  const run = data.run
  Object.assign(run, {
    description: data.description,
    flags: data.flags,
    displayName: data.displayName,
  })
  return run
}
