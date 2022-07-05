import { createHash } from 'crypto'
import envPaths from 'env-paths'
import fse from 'fs-extra'
import moment from 'moment'
import path from 'path'
import request from 'umi-request'

const appCacheDir = envPaths('clash-config-manager', { suffix: '' }).cache

const Base64 = {
  encode: (s: string) => Buffer.from(s, 'utf-8').toString('base64'),
  decode: (s: string) => Buffer.from(s, 'base64').toString('utf-8'),
}

const md5 = (s: string) => createHash('md5').update(s, 'utf8').digest('hex')

const readUrl = async ({ url, file }: { url: string; file: string }) => {
  const text = (await request.get(url, {
    responseType: 'text',
    headers: {
      'x-extra-headers': JSON.stringify({
        'user-agent': 'electron',
      }),
    },
  })) as string

  await fse.outputFile(file, text).then(
    () => {
      console.log('File %s writed', file)
    },
    (e) => {
      console.error(e.stack || e)
    }
  )

  return text
}

const urlToSubscribe = async ({
  url,
  forceUpdate: force,
}: {
  url: string
  forceUpdate: boolean
}) => {
  const file = path.join(appCacheDir, 'readUrl', md5(url))

  let shouldReuse = false
  let stat: fse.Stats
  // 今天之内的更新不会再下载
  const isRecent = (mtime: Date) =>
    moment(mtime).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')
  if (!force && fse.existsSync(file) && (stat = fse.statSync(file)) && isRecent(stat.mtime)) {
    shouldReuse = true
  }

  let text: string
  if (shouldReuse) {
    text = fse.readFileSync(file, 'utf8')
  } else {
    text = await readUrl({ url, file })
  }

  return textToSubscribe(text)
}

const textToSubscribe = (text: string) => {
  text = Base64.decode(text)
  const rawLines = text.split(/\r?\n/).filter(Boolean)
  const lines = rawLines
    .map((line) => {
      const idx = line.indexOf('://')
      const type = line.slice(0, idx)
      let text = line.slice(idx + '://'.length)
      text = Base64.decode(text)

      let server: ClashSsrServer | any
      if (type === 'vmess') server = getVmessServer(text)
      if (type === 'ssr') server = getSsrServer(text)
      if (!server) return

      return { type, server }
    })
    .filter(Boolean)

  return lines
}

const getVmessServer = (str: string) => {
  return JSON.parse(str)
}

/**
 * # ShadowsocksR
  # The supported ciphers (encryption methods): all stream ciphers in ss
  # The supported obfses:
  #   plain http_simple http_post
  #   random_head tls1.2_ticket_auth tls1.2_ticket_fastauth
  # The supported supported protocols:
  #   origin auth_sha1_v4 auth_aes128_md5
  #   auth_aes128_sha1 auth_chain_a auth_chain_b
  - name: "ssr"
    type: ssr
    server: server
    port: 443
    cipher: chacha20-ietf
    password: "password"
    obfs: tls1.2_ticket_auth
    protocol: auth_sha1_v4
    # obfs-param: domain.tld
    # protocol-param: "#"
    # udp: true
 */

export type SsrCipher =
  | 'rc4'
  | 'rc4-md5'
  | 'aes-128-gcm'
  | 'aes-192-gcm'
  | 'aes-256-gcm'
  | 'aes-128-cfb'
  | 'aes-192-cfb'
  | 'aes-256-cfb'
  | 'aes-128-ctr'
  | 'aes-192-ctr'
  | 'aes-256-ctr'
  | 'chacha20'
  | 'chacha20-ietf'
  | 'chacha20-ietf-poly1305'
  | 'xchacha20-ietf-poly1305'

export type SsrObfs =
  | 'plain'
  | 'http_simple'
  | 'http_post'
  | 'random_head'
  | 'tls1.2_ticket_auth'
  | 'tls1.2_ticket_fastauth'

export type SsrProtocol =
  | 'origin'
  | 'auth_sha1_v4'
  | 'auth_aes128_md5'
  | 'auth_aes128_sha1'
  | 'auth_chain_a'
  | 'auth_chain_b'

export interface ClashSsrServer {
  'name': string
  'type': 'ssr'
  'server': string
  'port': number
  'cipher': SsrCipher
  'password': string
  'obfs': SsrObfs
  'protocol': SsrProtocol
  'obfs-param'?: string
  'protocol-param'?: string
  'udp'?: boolean
}

const getSsrServer = (str: string): ClashSsrServer => {
  // hinet1.puffvip.com:1063:auth_aes128_sha1:chacha20:plain:UGFvZnU/?obfsparam=ZmE3Nzc4NzYzMS5taWNyb3NvZnQuY29t&protoparam=ODc2MzE6eHlqdHlza2Z5ZGhxc3M&remarks=W1YxXSDlj7Dmub4x&group=5rOh6IqZ5LqR

  const [prev, rest] = str.split('/?')
  // eslint-disable-next-line prefer-const
  let [server, port, protocol, cipher, obfs, password] = prev.split(':')
  const params = new URLSearchParams(rest)

  // @ts-ignore
  let { obfsparam, protoparam, remarks, group } = Array.from(params).reduce(
    (result, [key, value]) => {
      result[key] = value
      return result
    },
    {}
  )

  if (remarks) remarks = Base64.decode(remarks)
  if (group) group = Base64.decode(group)
  if (password) password = Base64.decode(password)
  if (obfsparam) obfsparam = Base64.decode(obfsparam)
  if (protoparam) protoparam = Base64.decode(protoparam)

  const ret: ClashSsrServer = {
    'name': `${group || ''} - ${remarks}` || '',
    'type': 'ssr',
    server,
    'port': Number(port),
    'cipher': cipher as SsrCipher,
    password,
    'obfs': obfs as SsrObfs,
    'protocol': protocol as SsrProtocol,
    'obfs-param': obfsparam || '',
    'protocol-param': protoparam || '',
  }
  return ret
}

export { Base64, textToSubscribe, urlToSubscribe, getVmessServer, getSsrServer }
