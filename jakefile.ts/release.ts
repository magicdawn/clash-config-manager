/* eslint-disable camelcase */

/**
 * 使用 GitHub Ations 发布步骤
 *  - npm version patch or minor
 *  - git push origin --all && git push origin --tags, 由 tags 触发 release
 *
 *
 * 使用本地 build 并上传, jake release 即可.
 *
 * 2024-06-11
 * 使用 github actions 自动 build / changelog / release
 * 步骤:
 * 1. npm version patch or minor
 * 2. git push origin --all && git push origin --tags
 */

import log from 'fancy-log'
import fg from 'fast-glob'
import fse from 'fs-extra'
import { version } from '../package.json'
import { PROJECT_ROOT, sh } from './util'

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

const changelogTempFile = PROJECT_ROOT + '/CHANGELOG.temp.md'
export function releaseChangelog() {
  fse.writeFileSync(changelogTempFile, getChangelog(), 'utf8')
  log('[changelog]: changelog.temp.md generated')
}

export async function release() {
  // 1. add Changelog
  // 2. npm version patch or minor

  // 3.prepare
  // 	- get changelog of this version
  releaseChangelog()

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
  const files = fg.sync(`./dist/clash-config-manager-${version}*`, { cwd: PROJECT_ROOT })
  sh(`gh release upload v${version} ./dist/latest-mac.yml ${files.join(' ')}`)

  // notification
  sh(`say "release complete"`)
}
