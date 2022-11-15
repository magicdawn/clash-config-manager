import { md5 } from '$clash-utils'
import envPaths from 'env-paths'
import fse from 'fs-extra'
import moment from 'moment'
import path from 'path'
import request from 'umi-request'

const appCacheDir = envPaths('clash-config-manager', { suffix: '' }).cache

export async function readUrlWithCache(url: string, forceUpdate = false) {
  const file = path.join(appCacheDir, 'readUrl', md5(url))

  let shouldReuse = false
  let stat: fse.Stats

  // 今天之内的更新不会再下载
  const isRecent = (mtime: Date) =>
    moment(mtime).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')
  if (!forceUpdate && fse.existsSync(file) && (stat = fse.statSync(file)) && isRecent(stat.mtime)) {
    shouldReuse = true
  }

  let text: string
  if (shouldReuse) {
    text = fse.readFileSync(file, 'utf8')
  } else {
    text = await request.get(url, { responseType: 'text' })
    await fse.outputFile(file, text, 'utf8')
  }

  return { text, byRequest: !shouldReuse }
}
