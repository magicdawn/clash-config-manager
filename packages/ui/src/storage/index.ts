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

export type StorageData = typeof storage extends Store<infer T> ? T : never

export default storage

export function getExportData() {
  const fullData = storage.store
  return _.omit(fullData, ['subscribe_detail', 'subscribe_status'])
}
export type ExportData = ReturnType<typeof getExportData>

// FIXME: debug only
// ;(global as any).estore = storage
