export interface Subscribe {
  id: string
  name: string
  url: string
  // 用于从 subscribe 里移除某些 proxy
  excludeKeywords?: string[]
}

export interface RuleItem {
  id?: string
  type: string
  name: string
  url?: string
  content?: string
}

export interface ConfigItem {}

export { default as ClashConfig } from './define/ClashConfig'
