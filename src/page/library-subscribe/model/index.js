import _ from 'lodash'
import storage from '../../../storage/index'

const STORAGE_KEY = 'subscribe_list'
const nsp = 'librarySubscribe'

export default {
  name: nsp,

  state: {
    inited: false,
    list: [],
  },

  reducers: {
    set(state, payload) {
      Object.assign(state, payload)
    },
  },

  effects: (dispatch) => {
    return {
      load() {
        const list = storage.get(STORAGE_KEY)
        this.set({list, inited: true})
      },

      persist(payload, rootState) {
        const {list} = rootState[nsp]
        storage.set(STORAGE_KEY, list)
      },

      init(payload, rootState) {
        const {inited} = rootState[nsp]
        if (inited) return
        this.load()
      },

      check({url, name, editItemIndex}, rootState) {
        let {list} = rootState[nsp]

        if (editItemIndex || editItemIndex === 0) {
          list = _.filter(list, (i, index) => index !== editItemIndex)
        }

        if (_.find(list, {url})) {
          return 'url已存在'
        }

        if (_.find(list, {name})) {
          return 'name已存在'
        }
      },

      add(item, rootState) {
        const {list} = rootState[nsp]
        const newlist = [...list, item]
        this.set({list: newlist})
        this.persist()
      },

      edit(item, rootState) {
        const {list} = rootState[nsp]
        const newlist = [...list]
        const {url, name, editItemIndex} = item
        newlist[editItemIndex] = {url, name}

        this.set({list: newlist})
        this.persist()
      },

      update(payload, rootState) {
        //
      },

      del(index, rootState) {
        const {list} = rootState[nsp]
        const newlist = [...list]
        newlist.splice(index, 1)
        this.set({list: newlist})
      },
    }
  },
}
