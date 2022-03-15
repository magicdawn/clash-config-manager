import {ClashSsrServer, urlToSubscribe} from './index'

export const makeClashProxy = (item) => {
  const {type} = item
  if (type === 'sep') return makeClashSepProxy(item.name)
  if (type === 'ssr') return makeClashSsrProxy(item)
  if (type === 'vmess') return makeClashVmessProxy(item)
}

// 分隔符
export const makeClashSepProxy = (name) => {
  const obj = {
    type: 'vmess',
    server: {
      v: '2',
      ps: name,
      add: '10086',
      port: 80,
      id: '4db9b2fe-a907-403e-ae35-c6c4ad32b5bd',
      aid: '2',
      net: 'tcp',
      type: 'none',
      host: '',
      path: '',
      tls: '',
    },
  }
  return makeClashVmessProxy(obj)
}

export const makeClashVmessProxy = (item) => {
  const {server: s, type} = item

  const clashProxyItem = {
    'type': type,
    'name': (s.ps || '').replace(/（/g, '(').replace(/）/g, ')'),
    'server': s.add,
    'port': s.port,
    'uuid': s.id,
    'alterId': s.aid,
    'cipher': 'auto',
    'skip-cert-verify': true,
    'network': s.net,
    'tls': Boolean(s.tls),

    // old
    // 'ws-path': s.path,
    // 'ws-headers': {
    //   Host: s.host,
    // },

    // new
    'ws-opts': {
      path: s.path,
      headers: {
        Host: s.host,
      },
    },

    // udp: true,
    // tls: true
    // skip-cert-verify: true
    // network: ws
    // ws-path: /path
    // ws-headers:
    // Host: v2ray.com
  }

  if (clashProxyItem.network === 'tcp') {
    // clash 不认识 tcp 啊
    delete clashProxyItem.network
  }

  return clashProxyItem
}

export const makeClashSsrProxy = (item: {type: 'ssr'; server: ClashSsrServer}) => {
  return item.server
}

export const subscribeToClash = async ({url, forceUpdate}: {url: string; forceUpdate: boolean}) => {
  const servers = await urlToSubscribe({url, forceUpdate})
  const clashProxies = servers.map(makeClashProxy)
  return clashProxies
}
