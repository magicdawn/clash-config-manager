export * from './ssr'
export * from './vmess'

import { ClashVmessProxyItem } from './vmess'
import { ClashSsrProxyItem } from './ssr'
import { ClashSsProxyItem } from './ss'

export type ClashProxyItem = ClashVmessProxyItem | ClashSsrProxyItem | ClashSsProxyItem
