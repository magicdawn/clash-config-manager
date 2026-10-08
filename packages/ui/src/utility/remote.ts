import path from 'node:path'
import { hfs } from '@humanfs/node'
import ky from 'ky'
import moment from 'moment'
import { appCacheDir } from '$ui/common'
import { fsp } from '$ui/libs'
import { exists } from './fs'
import { md5 } from './hasher'
import type { Stats } from 'node:fs'

export async function readUrlWithCache(url: string, forceUpdate = false) {
  const file = path.join(appCacheDir, 'readUrl', md5(url))

  let shouldReuse = false
  let stat: Stats

  // 今天之内的更新不会再下载
  const isRecent = (mtime: Date) => moment(mtime).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')
  if (!forceUpdate && (await exists(file)) && (stat = await fsp.stat(file)) && isRecent(stat.mtime)) {
    shouldReuse = true
  }

  let text: string
  if (shouldReuse) {
    text = (await hfs.text(file)) ?? ''
  } else {
    text = await ky.get(url).text()
    await hfs.write(file, text)
  }

  return { text, byRequest: !shouldReuse }
}
