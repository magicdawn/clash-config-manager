import path from 'node:path'
import { hfs } from '@humanfs/node'
import bytes from 'bytes'
import envPaths from 'env-paths'
import * as YAML from 'js-yaml'
import ky from 'ky'
import moment from 'moment'
import { fsp } from '$ui/libs'
import { EUaType, type ClashConfig } from '$ui/types'
import { exists } from './fs'
import { md5 } from './hasher'
import type { Stats } from 'node:fs'

const appCacheDir = envPaths('clash-config-manager', { suffix: '' }).cache

/**
 * subscribe url to proxy nodes/servers
 */
export async function getSubscribeNodesByUrl({
  url,
  forceUpdate,
  uaType,
}: {
  url: string
  forceUpdate: boolean
  uaType?: EUaType
}) {
  const file = path.join(appCacheDir, 'readUrl', md5(url))

  // 今天之内的更新不会再下载
  let shouldReuse = false
  let stat: Stats
  const isRecent = (mtime: Date) => moment(mtime).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')
  if (!forceUpdate && (await exists(file)) && (stat = await fsp.stat(file)) && isRecent(stat.mtime)) {
    shouldReuse = true
  }

  let text: string
  let valuableHeaders: Record<string, string> | undefined
  let status: string | undefined
  if (shouldReuse) {
    text = (await hfs.text(file)) ?? ''
  } else {
    ;({ text, valuableHeaders } = await readUrl({ url, file, uaType }))
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

const readUrl = async ({ url, file, uaType }: { url: string; file: string; uaType?: EUaType }) => {
  /**
   * user-agent matters
   * @see https://github.com/tindy2013/subconverter/blob/d47b8868e5a235ee99f07a0dece8f237d90109c8/src/handler/interfaces.cpp#L64
   */
  uaType ??= EUaType.Default
  const userAgent = (() => {
    switch (uaType) {
      case EUaType.Clash:
      case EUaType.ClashMeta:
        return uaType
      case EUaType.Empty:
        return undefined
      case EUaType.Default:
        return 'ClashX'
    }
  })()

  const res = await ky.get(url, {
    headers: userAgent ? { 'x-extra-headers': JSON.stringify({ 'user-agent': userAgent }) } : {},
    timeout: 30_000, // 30s, api.ytools.cc 可直连, 但时间很久
  })

  const text = await res.text()
  await hfs.write(file, text)
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
  // TODO: is this necessary?
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
