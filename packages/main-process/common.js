import {app, session} from 'electron'
import debugFactory from 'debug'
const debug = debugFactory('ccm:common')

function checkIfCalledViaCLI(args) {
  // in .app ['/Users/magicdawn/projects/clash-config-manager/dist/mac/clash-config-manager.app/Contents/MacOS/clash-config-manager']
  if (args[0]?.endsWith('.app/Contents/MacOS/clash-config-manager')) {
    const restArgs = args.slice(1).filter((arg) => !['--inspect', '--inspect-brk'].includes(args))
    const isCli = !!restArgs.length
    return {isCli, restArgs}
  }

  // dev [electron xxx.js]
  const scriptIndex = args.findIndex((arg) => arg?.endsWith('bundle/development/main/index.js'))
  if (scriptIndex === -1) {
    return {isCli: false}
  } else {
    const restArgs = args
      .slice(scriptIndex + 1)
      .filter((arg) => !['--inspect', '--inspect-brk'].includes(args))
    const isCli = !!restArgs.length
    return {isCli, restArgs}
  }
}

const isCli = process.env.CCM_RUN_MODE === 'cli'
const {restArgs} = checkIfCalledViaCLI(process.argv)
export {restArgs}
debug('process.argv: %O', {
  'process.argv': process.argv,
  isCli,
  restArgs,
})

export async function initCommon() {
  await app.whenReady()

  // with this, we can set user-agent in front-end
  // https://stackoverflow.com/a/35672988/2822866
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    let extraHeaders = {}
    if (details.requestHeaders['x-extra-headers']) {
      try {
        extraHeaders = JSON.parse(details.requestHeaders['x-extra-headers'])
      } catch (e) {
        // noop
      }
    }
    callback({cancel: false, requestHeaders: {...details.requestHeaders, ...extraHeaders}})
  })
}
