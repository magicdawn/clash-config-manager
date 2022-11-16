/* eslint camelcase: off */

import Store from 'electron-store'
import { ConfigItem, RuleItem, Subscribe } from '$ui/common/define'

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

type StoreData<T> = T extends Store<infer Inner> ? Inner : never
export type StorageData = StoreData<typeof storage>

export default storage

// FIXME: debug only
// ;(global as any).estore = storage
