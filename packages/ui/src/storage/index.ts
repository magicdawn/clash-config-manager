/* eslint camelcase: off */

// import Store from 'electron-store'
import { ConfigItem, RuleItem, Subscribe } from '$ui/common/define'
import { TauriStore } from './tauri-store'

const storage = new TauriStore({
  name: 'data',
  encryptionKey: 'clash-config-manager@@secret',
  // clearInvalidConfig: true,

  defaults: {
    subscribe_list: [] as Subscribe[],
    subscribe_detail: {},

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
    },
  },
})

type StoreData<T> = T extends TauriStore<infer Inner> ? Inner : never
export type StorageData = StoreData<typeof storage>

export default storage

// FIXME: debug only
// ;(global as any).estore = storage
