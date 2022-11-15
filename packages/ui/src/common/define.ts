export interface Subscribe {
  id: string
  name: string
  url: string

  // 用于从 subscribe 里移除某些 proxy
  excludeKeywords?: string[]

  // 自动更新订阅?
  autoUpdate: boolean
  autoUpdateInterval?: number // 小时
  updatedAt?: number // ts

  // visible
  urlVisible?: boolean
}

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
  content?: string
}

export interface RemoteRuleProviderRuleItem {
  type: 'remote-rule-provider'
  id: string
  name: string

  url: string
  autoUpdate?: boolean
  autoUpdateInterval?: number // 小时
  updatedAt?: number // ts

  // type=remote-provider
  providerBehavior: 'domain' | 'ipcidr' | 'classical'
  providerPolicy: 'DIRECT' | 'REJECT' | 'Proxy' | string

  // 内容
  payload?: string[]
}

export type RuleItem = LocalRuleItem | RemoteRuleItem | RemoteRuleProviderRuleItem

export interface ConfigItem {
  type: 'subscribe' | 'rule'
  id: string
  disabled?: boolean
}

export { default as ClashConfig } from './define/ClashConfig'
