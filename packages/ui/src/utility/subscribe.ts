import path from 'node:path'
import bytes from 'bytes'
import envPaths from 'env-paths'
import fse from 'fs-extra'
import YAML from 'js-yaml'
import ky from 'ky'
import moment from 'moment'
import { EUaType, type ClashConfig } from '$ui/types'
import { md5 } from './hasher'

const appCacheDir = envPaths('clash-config-manager', { suffix: '' }).cache

/**
 * subscribe url to proxy nodes/servers
 */
export async function getSubscribeNodesByUrl({
  url,
  forceUpdate,
  ua,
}: {
  url: string
  forceUpdate: boolean
  ua?: EUaType
}) {
  const file = path.join(appCacheDir, 'readUrl', md5(url))

  // 今天之内的更新不会再下载
  let shouldReuse = false
  let stat: fse.Stats
  const isRecent = (mtime: Date) => moment(mtime).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')
  if (!forceUpdate && (await fse.pathExists(file)) && (stat = await fse.stat(file)) && isRecent(stat.mtime)) {
    shouldReuse = true
  }

  let text: string
  let valuableHeaders: Record<string, string> | undefined
  let status: string | undefined
  if (shouldReuse) {
    text = await fse.readFile(file, 'utf-8')
  } else {
    ;({ text, valuableHeaders } = await readUrl({ url, file, ua }))
    if (valuableHeaders?.['subscription-userinfo']) {
      const val = valuableHeaders['subscription-userinfo']
      status = subscriptionUserinfoToStatus(val)
    } else {
      status = ''
    }
  }

  // 自己解析
  // const servers = textToSubscribe(text)

  // 从 yaml 抽出 proxies 即可
  const servers = extractProxiesFromClashYaml(text)

  return { servers, status }
}

const readUrl = async ({ url, file, ua }: { url: string; file: string; ua?: EUaType }) => {
  /**
   * user-agent matters
   * @see https://github.com/tindy2013/subconverter/blob/d47b8868e5a235ee99f07a0dece8f237d90109c8/src/handler/interfaces.cpp#L64
   */
  let userAgent = 'ClashX'
  if (ua && ua !== EUaType.Default) {
    userAgent = ua
  }

  const res = await ky.get(url, {
    headers: {
      'x-extra-headers': JSON.stringify({ 'user-agent': userAgent }),
    },
    timeout: 30_000, // 30s, api.ytools.cc 可直连, 但时间很久
  })

  const text = await res.text()
  await fse.outputFile(file, text)
  console.log('File %s writed', file)

  const headers = res.headers
  const valuableHeaderFields = ['profile-update-interval', 'subscription-userinfo']
  const valuableHeaders: Record<string, string> = {}

  for (const k of valuableHeaderFields) {
    if (headers.has(k)) {
      valuableHeaders[k] = headers.get(k) as string
    }
  }

  return { text, valuableHeaders }
}

function extractProxiesFromClashYaml(text: string) {
  // type tag
  text = text.replaceAll('!<str>', '!!str')

  const config = YAML.load(text) as ClashConfig
  const { proxies } = config

  // 处理
  // remove vmess proxy-item `udp:true`
  // proxies.forEach((p) => {
  //   if (p.type === 'vmess') {
  //     p.udp = undefined
  //   }
  // })

  return proxies
}

// upload=990312011; download=49112928036; total=107374182400; expire=1696997161
function subscriptionUserinfoToStatus(text: string) {
  const groups = text
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.split('=').map((s) => s.trim()))

  const data: Record<string, number> = {}
  for (const [key, val] of groups) {
    data[key] = Number(val)
  }

  const upload = bytes(data.upload as number)
  const download = bytes(data.download as number)
  const total = bytes(data.total as number)
  const expire = moment.unix(data.expire as number).format('YYYY-MM-DD')

  return `🚀 ↑: ${upload},  ↓: ${download},  TOT: ${total} 💡Expires: ${expire}`
}
