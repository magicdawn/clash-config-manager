import { urlLineToClashSsrServer, urlLineToClashVmessServer, type ClashProxyItem, type VmessUrlLine } from './define'
import { urlLineToClashSsServer } from './define/ss'
import { B64, truthy } from './utils'

export function textToSubscribe(text: string) {
  text = B64.decode(text)
  const rawLines = text.split(/\r?\n/).filter(Boolean)

  const servers = rawLines
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
      if (type === 'ss') {
        server = urlLineToClashSsServer(line)
      }
      if (type === 'ssr') {
        server = urlLineToClashSsrServer(text)
      }

      return server
    })
    .filter(truthy)

  return servers
}
