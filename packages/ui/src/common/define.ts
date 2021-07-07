export interface Subscribe {
  id: string
  name: string
  url: string
}

export interface RuleItem {
  id?: string
  type: string
  name: string
  url?: string
  content?: string
}

export interface ConfigItem {}

export {default as ClashConfig} from './define/ClashConfig'
