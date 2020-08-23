#!/usr/bin/env node

const abi = require('node-abi')
const semver = require('semver')
const {execSync} = require('child_process')

const sh = cmd => {
  console.log('[exec]: %s', cmd)
  execSync(cmd, {
    stdio: 'inherit',
  })
}

const targets = abi.supportedTargets.filter(item => {
  const {runtime, target, lts} = item
  if (runtime === 'node') {
    return semver.gte(target, '8.0.0')
  }
  if (runtime === 'electron') {
    return semver.gte(target, '6.0.0')
  }

  return false
})

const nodeVersions = targets.filter(item => item.runtime === 'node').map(item => item.target)
const electronVersions = targets
  .filter(item => item.runtime === 'electron')
  .map(item => item.target)

const nodeCmd = `yarn prebuild -r node ${nodeVersions.map(v => `-t ${v}`).join(' ')}`
const electronCmd = `yarn prebuild -r electron ${electronVersions.map(v => `-t ${v}`).join(' ')}`

console.log(nodeCmd)
console.log(electronCmd)
process.exit(0)

// clean
sh(`cd ${__dirname}`)
sh(`rm -rf ${__dirname + '/prebuilds'}`)

// build
sh(nodeCmd)
sh(electronCmd)
