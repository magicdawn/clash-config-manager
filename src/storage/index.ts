/* eslint camelcase: off */

import Store from 'electron-store'
import {RuleItem, Subscribe} from '@define'

const storage = new Store({
  name: 'data',
  encryptionKey: 'clash-config-manager@@secret',
  clearInvalidConfig: true,

  defaults: {
    subscribe_list: [] as Subscribe[],
    subscribe_detail: {},

    rule_list: [] as RuleItem[],

    current_config_v2: {
      list: [],
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

// fixme
;(global as any).estore = storage
export default storage
