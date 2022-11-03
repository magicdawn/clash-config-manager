/* eslint-disable prefer-const */

/**
# Shadowsocks
# The supported ciphers (encryption methods):
#   aes-128-gcm aes-192-gcm aes-256-gcm
#   aes-128-cfb aes-192-cfb aes-256-cfb
#   aes-128-ctr aes-192-ctr aes-256-ctr
#   rc4-md5 chacha20-ietf xchacha20
#   chacha20-ietf-poly1305 xchacha20-ietf-poly1305
- name: "ss1"
  type: ss
  server: server
  port: 443
  cipher: chacha20-ietf-poly1305
  password: "password"
  # udp: true

- name: "ss2"
  type: ss
  server: server
  port: 443
  cipher: chacha20-ietf-poly1305
  password: "password"
  plugin: obfs
  plugin-opts:
    mode: tls # or http
    # host: bing.com

- name: "ss3"
  type: ss
  server: server
  port: 443
  cipher: chacha20-ietf-poly1305
  password: "password"
  plugin: v2ray-plugin
  plugin-opts:
    mode: websocket # no QUIC now
    # tls: true # wss
    # skip-cert-verify: true
    # host: bing.com
    # path: "/"
    # mux: true
    # headers:
    #   custom: value
 */

import { B64 } from '../utils'

export interface ClashSsProxyItem {
  'type': 'ss'
  'name': string

  'server': string
  'port': number
  'cipher': ClashSsCipher
  'password': string
  'udp'?: boolean

  'plugin'?: string
  'plugin-opts'?: object
}

/**
 * Support Types
 */

export type ClashSsCipher =
  | 'aes-128-gcm'
  | 'aes-192-gcm'
  | 'aes-256-gcm'
  | 'aes-128-cfb'
  | 'aes-192-cfb'
  | 'aes-256-cfb'
  | 'aes-128-ctr'
  | 'aes-192-ctr'
  | 'aes-256-ctr'
  | 'rc4-md5'
  | 'chacha20-ietf'
  | 'xchacha20'
  | 'chacha20-ietf-poly1305'
  | 'xchacha20-ietf-poly1305'

// ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTo5NDcxMTI1NS1hYjJlLTQxZGQtYjMwMS0xMDlkMWYwNDdlNzM@some.host.com:12345#xxxx_encode_url_component(name)__
// ss://${B64_encode(ciper + ':' + password)}@host:port#encodeURLComponent(name)
//
// 实例
// https://github.com/tindy2013/subconverter/blob/master/src/generator/config/subexport.cpp#L876
// TODO: udp, plugin, plugin-opts
export function urlLineToClashSsServer(str: string): ClashSsProxyItem {
  let rest = str.slice('ss://'.length)

  const atIndex = rest.indexOf('@')
  const ciperAndPass = rest.slice(0, atIndex)
  const [cipher, password] = B64.decode(ciperAndPass).split(':')

  rest = rest.slice(atIndex + 1)
  const hashMarkIndex = rest.indexOf('#')
  const serverAndPort = rest.slice(0, hashMarkIndex)
  const [server, port] = serverAndPort.split(':')

  rest = rest.slice(hashMarkIndex + 1)
  const name = decodeURIComponent(rest)

  const ret: ClashSsProxyItem = {
    type: 'ss',
    name: name || '',
    server,
    port: Number(port),
    cipher: cipher as ClashSsCipher,
    password,
  }

  return ret
}
