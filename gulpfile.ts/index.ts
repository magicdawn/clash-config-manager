import log from 'fancy-log'
import {TaskFunctionParams} from 'undertaker'

export default async function () {
  log('default')
}

export {default as release} from './release'

Object.assign(buildUi, {
  displayName: 'build:ui',
  description: 'build 前端代码',
} as TaskFunctionParams)
export async function buildUi() {
  log('build:ui')
}
