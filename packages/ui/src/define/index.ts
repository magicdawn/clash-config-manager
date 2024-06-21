export { ClashConfig } from './ClashConfig'

export interface Subscribe<ExtData = any> {
  id: string
  name: string
  url: string

  // 用于从 subscribe 里移除某些 proxy
  excludeKeywords?: string[]

  // 自动更新订阅?
  autoUpdate?: boolean
  autoUpdateInterval?: number // 小时
  updatedAt?: number // ts

  // visible
  urlVisible?: boolean

  // proxy 的名字是否加上 `subscribe.name` 作为前缀
  addPrefixToProxies?: boolean

  // 扩展
  special?: boolean
  specialType?: SubscribeSpecialType
  specialData?: ExtData
}

// add more special types here
export type SubscribeSpecialType = 'nodefree'

export type LocalRuleItem = {
  type: 'local'
  id: string
  name: string

  content: string
}

export type RemoteRuleItem = {
  type: 'remote'
  id: string
  name: string

  url: string
  autoUpdate?: boolean
  autoUpdateInterval?: number // 小时
  updatedAt?: number // ts

  // 内容
  // content?: string
}

export type RuleItem = LocalRuleItem | RemoteRuleItem

export interface ConfigItem {
  type: 'subscribe' | 'rule'
  id: string
  disabled?: boolean
}
