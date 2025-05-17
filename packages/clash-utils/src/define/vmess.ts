/**
 * 参考链接
 * - clash 文档 https://github.com/Dreamacro/clash/wiki/configuration#proxy-providers
 * - v2ray utils https://github.com/kltk/v2ray-tools/blob/master/src/vmess2config.js
 * - https://blog.kingrong.kr/js-decode-for-clash/#yi-yi-dui-ying
 *
 */

/**
# vmess
# cipher support auto/aes-128-gcm/chacha20-poly1305/none
- name: "vmess"
  type: vmess
  server: server
  port: 443
  uuid: uuid
  alterId: 32
  cipher: auto
  # udp: true
  # tls: true
  # skip-cert-verify: true
  # servername: example.com # priority over wss host
  # network: ws
  # ws-opts:
  #   path: /path
  #   headers:
  #     Host: v2ray.com
  #   max-early-data: 2048
  #   early-data-header-name: Sec-WebSocket-Protocol

- name: "vmess-h2"
  type: vmess
  server: server
  port: 443
  uuid: uuid
  alterId: 32
  cipher: auto
  network: h2
  tls: true
  h2-opts:
    host:
      - http.example.com
      - http-alt.example.com
    path: /

- name: "vmess-http"
  type: vmess
  server: server
  port: 443
  uuid: uuid
  alterId: 32
  cipher: auto
  # udp: true
  # network: http
  # http-opts:
  #   # method: "GET"
  #   # path:
  #   #   - '/'
  #   #   - '/video'
  #   # headers:
  #   #   Connection:
  #   #     - keep-alive

- name: vmess-grpc
  server: server
  port: 443
  type: vmess
  uuid: uuid
  alterId: 32
  cipher: auto
  network: grpc
  tls: true
  servername: example.com
  # skip-cert-verify: true
  grpc-opts:
    grpc-service-name: "example"
 */

export interface ClashVmessProxyItem {
  'type': 'vmess'

  'name': string
  'server': string
  'port': number
  'uuid': string
  'alterId': number
  'cipher': ClashVmess.Ciper

  // misc
  'udp'?: boolean
  'servername'?: string //priority over wss host

  // tls
  'tls'?: boolean
  'skip-cert-verify'?: boolean

  'network'?: ClashVmess.Network
  // network opts
  'ws-opts'?: ClashVmess.WsOpts
  'http-opts'?: ClashVmess.HttpOpts
  'h2-opts'?: ClashVmess.H2Opts
  'grpc-opts'?: ClashVmess.GrpcOpts
}

export namespace ClashVmess {
  export type Ciper = 'auto' | 'aes-128-gcm' | 'chacha20-poly1305' | 'none'

  // vmess://{net: 'tcp', type: 'http'} = clash 中的 net:http
  // 见 https://github.com/kltk/v2ray-tools/blob/4dfac04496b84f31df99c31604e1e1ab315dec4c/src/vmess2config.js#L30
  export type Network = 'tcp' | 'http' | 'h2' | 'quic' | 'kcp' | 'ws' | 'grpc'

  // ws-opts:
  //   path: /path
  //   headers:
  //     Host: v2ray.com
  //   max-early-data: 2048
  //   early-data-header-name: Sec-WebSocket-Protocol
  export interface WsOpts {
    'path'?: string
    'headers'?: {
      Host?: string
      [key: string]: string | undefined
    }
    'max-early-data'?: number
    'early-data-header-name'?: string
  }

  // http-opts:
  //   # method: "GET"
  //   # path:
  //   #   - '/'
  //   #   - '/video'
  //   # headers:
  //   #   Connection:
  //   #     - keep-alive
  export interface HttpOpts {
    method?: string
    path?: string | string[]
    headers?: {
      [key: string]: string | undefined
    }
  }

  // h2-opts:
  //   host:
  //     - http.example.com
  //     - http-alt.example.com
  //   path: /
  export interface H2Opts {
    host?: string | string[]
    path?: string
    [key: string]: any
  }

  // grpc-opts:
  //     grpc-service-name: "example"
  export interface GrpcOpts {
    'grpc-service-name'?: string
    [key: string]: any | undefined
  }
}

/**
 * https://github.com/2dust/v2rayN/wiki/分享链接格式说明(ver-2)
 */

export interface VmessUrlLine {
  v: string
  ps: string
  add: string
  port: string
  id: string
  aid: string
  net: ClashVmess.Network
  type?: string
  scy?: ClashVmess.Ciper
  host?: string
  path?: string
  tls?: string
  sni?: string
}

function normalize(name: string) {
  return name.replaceAll('（', '(').replaceAll('）', ')')
}

export function urlLineToClashVmessServer(line: VmessUrlLine) {
  const server: ClashVmessProxyItem = {
    'type': 'vmess',
    'name': normalize(line.ps || ''),
    'server': line.add,
    'port': Number(line.port),
    'uuid': line.id,
    'alterId': Number(line.aid),
    'cipher': line.scy || 'auto',
    'network': line.net,
    'tls': Boolean(line.tls),
    'skip-cert-verify': true,
  }

  if (line.sni) {
    server.servername = line.sni
  }

  // clash 不认识 tcp
  // 当 type=http 时, 转换成 clash 支持的 http
  // 其他情况先返回 null, 过滤掉
  if (server.network === 'tcp') {
    if (line.type === 'http') {
      server.network = 'http'
    } else {
      delete server.network
    }
  }

  // udp
  // 不知道为什么这么写, line 里面没有表示, 机场返回的 config.yaml 里就是
  if (server.network === 'ws') {
    server.udp = true
  }

  // network opts
  // yaml 不支持 undefined, 写成 null or ''
  if (line.host || line.path) {
    if (server.network === 'ws') {
      server['ws-opts'] = {
        path: line.path || '',
        headers: {
          Host: line.host || '',
        },
      }
    }
    if (server.network === 'h2') {
      server['h2-opts'] = {
        host: line.host || '',
        path: line.path || '',
      }
    }
    if (server.network === 'http') {
      server['http-opts'] = {
        path: line.path || '',
        headers: {
          Host: line.host || '',
        },
      }
    }
    if (server.network === 'grpc') {
      server['grpc-opts'] = {
        'grpc-service-name': line.path || '',
      }
    }
  }

  return server
}
