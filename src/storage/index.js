import Store from 'electron-store'
/* eslint camelcase: off */

const storage = new Store({
  name: 'data',
  encryptionKey: 'clash-config-manager@@secret',
  clearInvalidConfig: true,

  defaults: {
    subscribe_list: [],
    subscribe_detail: {},

    rule_list: [],

    current_config_v2: {
      list: [],
      name: 'clash-config-manager',
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
window.estore = storage
export default storage
