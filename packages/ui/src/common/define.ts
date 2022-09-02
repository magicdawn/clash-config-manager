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

export interface RuleItem {
  id: string
  type: string
  name: string
  url?: string
  content?: string
}

export interface ConfigItem {
  type: 'subscribe' | 'rule'
  id: string
}

export { default as ClashConfig } from './define/ClashConfig'
