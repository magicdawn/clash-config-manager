import _ from 'lodash'
import storage from '../../../storage/index'
import {subscribeToClash} from '../../../util/fn/clash'
import {message} from 'antd'

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
