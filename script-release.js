#!/usr/bin/env node
/* eslint camelcase: off */

const {execSync} = require('child_process')
const sh = (cmd) => {
  console.log('[exec]: %s', cmd)
  execSync(cmd, {stdio: 'inherit'})
}

// 1. add Changelog
// 2. npm version patch or minor

// 3.push
sh('git push origin --all && git push origin --tags')

// 4.build
sh('yarn dist:mac')

// 5.release
const {version} = require('./package.json')

// need proxy
Object.assign(process.env, {
  https_proxy: 'http://127.0.0.1:7890',
  http_proxy: 'http://127.0.0.1:7890',
  all_proxy: 'socks5://127.0.0.1:7890',
})
sh(`gh release create v${version} -F CHANGELOG.md`)
sh(`gh release upload v${version} ./dist/clash-config-manager-${version}.dmg`)
