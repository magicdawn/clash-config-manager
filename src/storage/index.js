import Store from 'electron-store'

/* eslint camelcase: off */

export default new Store({
  name: 'data',
  defaults: {
    subscribe_list: [],
    subscribe_detail: {},

    rule_list: [],

    current_config: {
      rules: [],
      subscribe: [],
    },
  },
})
