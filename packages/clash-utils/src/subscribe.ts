// import envPaths from 'env-paths'
// import fse from 'fs-extra'
import moment from 'moment'
// import path from 'path'
import request from 'umi-request'
import {
  ClashProxyItem,
  urlLineToClashSsrServer,
  urlLineToClashVmessServer,
  VmessUrlLine,
} from './define'
import { B64, md5, truthy } from './utils'
import { app, path, http } from '@tauri-apps/api'

export async function subscribeToClash({
  url,
  forceUpdate,
}: {
  url: string
  forceUpdate: boolean
}) {
  return urlToSubscribe({ url, forceUpdate })
}

const appCacheDir = await path.join(await path.cacheDir(), await app.getName())
console.log(appCacheDir)
// ('clash-config-manager', { suffix: '' }).cache

async function urlToSubscribe({ url, forceUpdate: force }: { url: string; forceUpdate: boolean }) {
  // const file = path.join(appCacheDir, 'readUrl', md5(url))

  // let shouldReuse = false
  // let stat: fse.Stats
  // // 今天之内的更新不会再下载
  // const isRecent = (mtime: Date) =>
  //   moment(mtime).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')
  // if (!force && fse.existsSync(file) && (stat = fse.statSync(file)) && isRecent(stat.mtime)) {
  //   shouldReuse = true
  // }

  // let text: string
  // if (shouldReuse) {
  //   text = fse.readFileSync(file, 'utf8')
  // } else {
  //   text = await readUrl({ url, file })
  // }

  const client = await http.getClient()
  const text = (await client.get(url)).data as string
  return textToSubscribe(text)
}

function textToSubscribe(text: string) {
  text = B64.decode(text)
  const rawLines = text.split(/\r?\n/).filter(Boolean)
  const lines = rawLines
    .map((line) => {
      const idx = line.indexOf('://')
      const type = line.slice(0, idx)
      let text = line.slice(idx + '://'.length)
      text = B64.decode(text)

      let server: ClashProxyItem | undefined
      if (type === 'vmess') {
        const line = JSON.parse(text) as VmessUrlLine
        server = urlLineToClashVmessServer(line)
      }
      if (type === 'ssr') {
        server = urlLineToClashSsrServer(text)
      }

      return server
    })
    .filter(truthy)
  return lines
}

// const readUrl = async ({ url, file }: { url: string; file: string }) => {
//   const text = (await request.get(url, {
//     responseType: 'text',
//     headers: {
//       'x-extra-headers': JSON.stringify({
//         'user-agent': 'electron',
//       }),
//     },
//   })) as string

//   await fse.outputFile(file, text).then(
//     () => {
//       console.log('File %s writed', file)
//     },
//     (e) => {
//       console.error(e.stack || e)
//     }
//   )

//   return text
// }
