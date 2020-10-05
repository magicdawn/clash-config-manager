#!/usr/bin/env node
/* eslint camelcase: off */

const {execSync} = require('child_process')
const fse = require('fs-extra')
const globby = require('globby')
const argv = require('minimist')(process.argv.slice(2))

const sh = (cmd) => {
  console.log('[exec]: %s', cmd)
  if (argv['dry-run']) {
    // just print
  } else {
    execSync(cmd, {stdio: 'inherit'})
  }
}

// 1. add Changelog
// 2. npm version patch or minor

// 3.prepare
// 	- get changelog of this version
const changelogTempFile = __dirname + '/CHANGELOG.temp.md'
{
  const fullChangeLog = fse.readFileSync(__dirname + '/CHANGELOG.md', 'utf8')
  const lines = fullChangeLog.split('\n')
  const usingLines = []
  let h2Count = 0

  for (let line of lines) {
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
  fse.writeFileSync(changelogTempFile, curChangelog, 'utf8')
  console.log('[changelog]: changelog.temp.md generated')
}

// 4.push
sh('git push origin --all && git push origin --tags')

// 5.build
sh('yarn dist:mac')

// 6.release
const {version} = require('./package.json')

// need proxy
Object.assign(process.env, {
  https_proxy: 'http://127.0.0.1:7890',
  http_proxy: 'http://127.0.0.1:7890',
  all_proxy: 'socks5://127.0.0.1:7890',
})
sh(`gh release create v${version} -F ${changelogTempFile}`)

// find out files
const files = globby.sync(`./dist/clash-config-manager-${version}*`, {cwd: __dirname})
sh(`gh release upload v${version} ./dist/latest-mac.yml ${files.join(' ')}`)

// notification
sh(`say "release complete"`)
