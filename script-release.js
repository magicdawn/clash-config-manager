#!/usr/bin/env node

const {execSync} = require('child_process')

const sh = (cmd) => {
  console.log('[exec]: %s', cmd)
  execSync(cmd, {stdio: 'inherit'})
}

// 1. add Changelog
// 2. npm version patch or minor

// 3.push
sh('gp origin --all && gp origin --tags')

// 4.build
sh('yarn dist:mac')

// 5.release
const {version} = require('./package.json')
sh(`gh release create v${version} -F CHANGELOG.md`)
sh(`gh release upload v${version} ./dist/clash-config-manager-${version}.dmg`)
