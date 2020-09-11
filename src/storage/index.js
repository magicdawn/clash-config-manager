import Store from 'electron-store'

/* eslint camelcase: off */

export default new Store({
  name: 'data',
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
