import _ from 'lodash'
import storage from '../../../storage/index'
import {subscribeToClash} from '../../../util/fn/clash'
import {message} from 'antd'

const nsp = 'preference'
const STORAGE_KEY = nsp

export default {
  name: nsp,

  state: {
    inited: false,
    syncConfig: {
      davServerUrl: '',
      user: '',
      pass: '',
    },
  },

  effects: (dispatch) => {
    return {
      load() {
        const storeValues = storage.get(STORAGE_KEY)
        this.setState({inited: true, ...storeValues})
      },
      persist(payload, rootState) {
        storage.set(STORAGE_KEY, _.omit(this.state, ['inited']))
      },
      init(payload, rootState) {
        const {inited} = this.state
        if (inited) return
        this.load()
      },
    }
  },
}
