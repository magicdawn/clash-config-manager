export * from './ssr'
export * from './vmess'

import { ClashSsProxyItem } from './ss'
import { ClashSsrProxyItem } from './ssr'
import { ClashVmessProxyItem } from './vmess'

export type ClashProxyItem = ClashVmessProxyItem | ClashSsrProxyItem | ClashSsProxyItem
