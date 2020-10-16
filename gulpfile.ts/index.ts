import log from 'fancy-log'

export default async function () {
  log('default')
}

export {default as release} from './release'
