import Store from 'electron-store'

/* eslint camelcase: off */

export default new Store({
  name: 'data',
  defaults: {
    subscribe_list: [],
    subscribe_detail: {},
  },
})
