import { md5 } from '$clash-utils'
import { cacheDir } from '$ui/common'
import fse from 'fs-extra'
import moment from 'moment'
import path from 'path'
import request from 'umi-request'

export async function readUrlWithCache(url: string, forceUpdate = false) {
  const file = path.join(cacheDir, 'readUrl', md5(url))

  let shouldReuse = false
  let stat: fse.Stats

  // 今天之内的更新不会再下载
  const isRecent = (mtime: Date) =>
    moment(mtime).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')
  if (
    !forceUpdate &&
    (await fse.pathExists(file)) &&
    (stat = await fse.stat(file)) &&
    isRecent(stat.mtime)
  ) {
    shouldReuse = true
  }

  let text: string
  if (shouldReuse) {
    text = await fse.readFile(file, 'utf8')
  } else {
    text = await request.get(url, { responseType: 'text' })
    await fse.outputFile(file, text, 'utf8')
  }

  return { text, byRequest: !shouldReuse }
}
