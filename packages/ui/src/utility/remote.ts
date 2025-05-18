import path from 'node:path'
import fse from 'fs-extra'
import ky from 'ky'
import moment from 'moment'
import { md5 } from '$clash-utils'
import { appCacheDir } from '$ui/common'

export async function readUrlWithCache(url: string, forceUpdate = false) {
  const file = path.join(appCacheDir, 'readUrl', md5(url))

  let shouldReuse = false
  let stat: fse.Stats

  // 今天之内的更新不会再下载
  const isRecent = (mtime: Date) => moment(mtime).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')
  if (!forceUpdate && (await fse.pathExists(file)) && (stat = await fse.stat(file)) && isRecent(stat.mtime)) {
    shouldReuse = true
  }

  let text: string
  if (shouldReuse) {
    text = await fse.readFile(file, 'utf8')
  } else {
    text = await ky.get(url).text()
    await fse.outputFile(file, text, 'utf8')
  }

  return { text, byRequest: !shouldReuse }
}
