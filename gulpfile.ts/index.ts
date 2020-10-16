import log from 'fancy-log'
import {task} from './util'

export default async function () {
  log('default')
}

export {default as release} from './release'

export const buildUi = task({
  displayName: 'build:ui',
  description: 'build 前端代码',
  async run() {
    log('build:ui')
  },
})
