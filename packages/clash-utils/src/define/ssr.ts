import { B64 } from '../utils'

/**
 * for SSR in clash
 */

/**
# ShadowsocksR

The supported ciphers (encryption methods): all stream ciphers in ss
The supported obfses:
  plain http_simple http_post
  random_head tls1.2_ticket_auth tls1.2_ticket_fastauth
The supported supported protocols:
  origin auth_sha1_v4 auth_aes128_md5
  auth_aes128_sha1 auth_chain_a auth_chain_b

e.g

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

export interface ClashSsrProxyItem {
  'type': 'ssr'
  'name': string
  'server': string
  'port': number
  'cipher': ClashSsr.Cipher
  'password': string
  'obfs': ClashSsr.Obfs
  'protocol': ClashSsr.Protocol
  'obfs-param'?: string
  'protocol-param'?: string
  'udp'?: boolean
}

/**
 * Support Types
 */

export namespace ClashSsr {
  export type Cipher =
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

  export type Obfs =
    | 'plain'
    | 'http_simple'
    | 'http_post'
    | 'random_head'
    | 'tls1.2_ticket_auth'
    | 'tls1.2_ticket_fastauth'

  export type Protocol =
    | 'origin'
    | 'auth_sha1_v4'
    | 'auth_aes128_md5'
    | 'auth_aes128_sha1'
    | 'auth_chain_a'
    | 'auth_chain_b'
}

export function urlLineToClashSsrServer(str: string): ClashSsrProxyItem {
  // e.g hinet1.puffvip.com:1063:auth_aes128_sha1:chacha20:plain:UGFvZnU/?obfsparam=ZmE3Nzc4NzYzMS5taWNyb3NvZnQuY29t&protoparam=ODc2MzE6eHlqdHlza2Z5ZGhxc3M&remarks=W1YxXSDlj7Dmub4x&group=5rOh6IqZ5LqR

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

  if (remarks) remarks = B64.decode(remarks)
  if (group) group = B64.decode(group)
  if (password) password = B64.decode(password)
  if (obfsparam) obfsparam = B64.decode(obfsparam)
  if (protoparam) protoparam = B64.decode(protoparam)

  const ret: ClashSsrProxyItem = {
    'name': `${group || ''} - ${remarks}` || '',
    'type': 'ssr',
    server,
    'port': Number(port),
    'cipher': cipher as ClashSsr.Cipher,
    password,
    'obfs': obfs as ClashSsr.Obfs,
    'protocol': protocol as ClashSsr.Protocol,
    'obfs-param': obfsparam || '',
    'protocol-param': protoparam || '',
  }
  return ret
}
