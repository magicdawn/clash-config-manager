import _ from 'lodash'
import storage from '../../../storage/index'
import {subscribeToClash} from '../../../util/fn/clash'
import {message} from 'antd'

const nsp = 'currentConfig'
const CURRENT_CONFIG_STORAGE_KEY = 'current_config'

export default {
  name: nsp,

  state: {
    inited: false,
    config: {
      subscribe: [],
      rules: [],
    },
  },

  effects: (dispatch) => {
    return {
      load() {
        const config = storage.get(CURRENT_CONFIG_STORAGE_KEY)
        this.setState({inited: true, config})
      },

      persist(payload, rootState) {
        const {config} = this.state
        storage.set(CURRENT_CONFIG_STORAGE_KEY, config)
      },

      init(payload, rootState) {
        const {inited} = this.state
        if (inited) return
        this.load()
      },

      modifyConfig(payload, rootState) {
        this.setState((slice) => {
          payload(slice.config)
        })
        this.persist()
      },
    }
  },
}
