export interface Subscribe {
  id: string
  name: string
  url: string
}

export interface RuleItem {
  type: string
  name: string
  url?: string
  content?: string
}

export interface ConfigItem {}
