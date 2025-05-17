import type { ClashSsProxyItem } from './ss'
import type { ClashSsrProxyItem } from './ssr'
import type { ClashVmessProxyItem } from './vmess'

export * from './ssr'
export * from './vmess'

export type ClashProxyItem = ClashVmessProxyItem | ClashSsrProxyItem | ClashSsProxyItem
