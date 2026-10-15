/* eslint camelcase: off */

import Store from 'electron-store'
import { omit } from 'es-toolkit'
import { keysToOmit } from './config'
import type { ConfigItem, RuleItem, Subscribe } from '$ui/models'

export { customMerge } from './customMerge'

export function createStorage() {
  return new Store({
    name: 'data',
    encryptionKey: 'clash-config-manager@@secret',
    clearInvalidConfig: true,

    defaults: {
      subscribe_list: [] as Subscribe[],
      subscribe_detail: {},
      subscribe_status: {},

      rule_list: [] as RuleItem[],

      current_config_v2: {
        list: [] as ConfigItem[],
        name: 'clash-config-manager',
        generateAllProxyGroup: false,
        generateSubNameProxyGroup: false,

        // 最快 / 可用 / ✋🏻选择
        // Fastest / Available / Select
        generatedGroupNameLang: 'zh', // possible: zh | en

        // 🚀 ✅ ✋🏻
        generatedGroupNameEmoji: true,
      },

      preference: {
        syncConfig: {
          davServerUrl: '',
          user: '',
          pass: '',
        },
        vscodeTheme: '',
        useSystemProxy: false,
      },
    },
  })
}

const storage = createStorage()
export default storage

// FIXME: debug only
// ;(global as any).estore = storage

export type StorageData = ReturnType<typeof createStorage> extends Store<infer T> ? T : never

/**
 * base data for export
 */
export function getExportData() {
  const fullData = storage.store
  return omit(fullData, keysToOmit)
}
export type ExportData = ReturnType<typeof getExportData>

/**
 * names
 */
export const routeTitles = {
  'subscribe-list': '订阅管理',
  'partial-config-list': '配置源(Partial Config)',
  'current-config': '配置组装(Config Builder)',
  'preference': '偏好设置',
}

export const storageDataDisplayNames: Record<string, string> = {
  'subscribe_list': `${routeTitles['subscribe-list']} (有泄露风险, 谨慎导出分享)`,
  'rule_list': `${routeTitles['partial-config-list']}`,
  'current_config_v2': `${routeTitles['current-config']}`,
  'current_config_v2.list': '使用中的列表',
  'current_config_v2.name': '配置文件名称',
  'preference': `${routeTitles.preference}`,
  'preference.syncConfig': '同步数据配置',
  'preference.syncConfig.user': '用户名',
  'preference.syncConfig.pass': '密码 (有泄露风险, 谨慎导出分享)',
  'preference.vscodeTheme': '内置 monaco 编辑器主题',
  'preference.useSystemProxy': '使用系统代理',
}
