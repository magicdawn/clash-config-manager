import _ from 'lodash'
import {message} from 'antd'
import storage from '../../../storage/index'
import {createModel} from '@rematch/core'
import {RootModel} from '../../../models'

const nsp = 'preference'
const STORAGE_KEY = nsp

const model = createModel<RootModel>()({
  name: nsp,

  state: {
    inited: false,
    syncConfig: {
      davServerUrl: '',
      user: '',
      pass: '',
    },
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
})

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
