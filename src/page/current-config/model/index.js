import _ from 'lodash'
import {message} from 'antd'
import storage from '../../../storage/index'

const nsp = 'currentConfig'
const CURRENT_CONFIG_STORAGE_KEY = 'current_config_v2'

export default {
  name: nsp,

  state: {
    inited: false,
    list: [],
    name: '',
    forceUpdate: true,
  },

  listen: {
    'global/reload'() {
      this.load()
    },

    'global/init'() {
      this.init()
    },
  },

  effects: (dispatch) => {
    return {
      load() {
        const storeValues = storage.get(CURRENT_CONFIG_STORAGE_KEY)
        this.setState({inited: true, ...storeValues})
      },
      persist(payload, rootState) {
        storage.set(CURRENT_CONFIG_STORAGE_KEY, _.omit(this.state, ['inited']))
      },
      init(payload, rootState) {
        const {inited} = this.state
        if (inited) return
        this.load()
      },

      modifyList(payload, rootState) {
        this.setState((slice) => {
          payload(slice.list)
        })
        this.persist()
      },

      changeState(payload) {
        this.setState(payload)
        this.persist()
      },
    }
  },
}
