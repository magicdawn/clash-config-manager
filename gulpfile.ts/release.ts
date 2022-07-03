/* eslint-disable camelcase */

import fse from 'fs-extra'
import globby from 'globby'
import log from 'fancy-log'
import { version } from '../package.json'
import { sh, PROJECT_ROOT } from './util'
import { TaskFunction } from 'gulp'

const r = release as TaskFunction
r.description = '发布release'
export { release }

function getChangelog() {
  const fullChangeLog = fse.readFileSync(PROJECT_ROOT + '/CHANGELOG.md', 'utf8')
  const lines = fullChangeLog.split('\n')
  const usingLines: string[] = []
  let h2Count = 0

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (!h2Count) {
        usingLines.push(line)
        h2Count++
      } else {
        break
      }
    } else {
      usingLines.push(line)
    }
  }
  const curChangelog = usingLines.join('\n')
  return curChangelog
}

async function release() {
  // 1. add Changelog
  // 2. npm version patch or minor

  // 3.prepare
  // 	- get changelog of this version
  const changelogTempFile = PROJECT_ROOT + '/CHANGELOG.temp.md'
  fse.writeFileSync(changelogTempFile, getChangelog(), 'utf8')
  log('[changelog]: changelog.temp.md generated')

  // 4.push
  sh('git push origin --all && git push origin --tags')

  // 5.build
  sh('pnpm dist:mac')

  // 6.release
  // need proxy
  Object.assign(process.env, {
    https_proxy: 'http://127.0.0.1:7890',
    http_proxy: 'http://127.0.0.1:7890',
    all_proxy: 'socks5://127.0.0.1:7890',
  })
  sh(`gh release create v${version} -F ${changelogTempFile}`)

  // find out files
  const files = globby.sync(`./dist/clash-config-manager-${version}*`, { cwd: PROJECT_ROOT })
  sh(`gh release upload v${version} ./dist/latest-mac.yml ${files.join(' ')}`)

  // notification
  sh(`say "release complete"`)
}
