/* eslint camelcase: off */

import { ConfigItem, RuleItem, Subscribe } from '$ui/common/define'
import Store from 'electron-store'
import _ from 'lodash'

const storage = new Store({
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
      forceUpdate: true,
    },

    preference: {
      syncConfig: {
        davServerUrl: '',
        user: '',
        pass: '',
      },
      vscodeTheme: '',
    },
  },
})

export default storage
export type StorageData = typeof storage extends Store<infer T> ? T : never

/**
 * base data for export
 */
export function getExportData() {
  const fullData = storage.store
  return _.omit(fullData, ['subscribe_detail', 'subscribe_status'])
}
export type ExportData = ReturnType<typeof getExportData>

/**
 * names
 */
export const routeTitles = {
  'library-subscribe': '订阅管理',
  'library-rule-list': '配置源(Partial Config)',
  'current-config': '配置组装(Config Builder)',
  'preference': '偏好设置',
}

export const storageDataDisplayNames: Record<string, string> = {
  'subscribe_list': `${routeTitles['library-subscribe']} (有泄露风险, 谨慎导出分享)`,
  'rule_list': `${routeTitles['library-rule-list']}`,
  'current_config_v2': `${routeTitles['current-config']}`,
  'current_config_v2.list': '使用中的列表',
  'current_config_v2.name': '配置文件名称',
  'preference': `${routeTitles.preference}`,
  'preference.syncConfig': '同步数据配置',
  'preference.syncConfig.user': '用户名',
  'preference.syncConfig.pass': '密码 (有泄露风险, 谨慎导出分享)',
  'preference.vscodeTheme': '内置 monaco 编辑器主题',
}

// FIXME: debug only
// ;(global as any).estore = storage
