import _ from 'lodash'
import storage from '../../../storage/index'
import {subscribeToClash} from '../../../util/fn/clash'

const nsp = 'librarySubscribe'
const SUBSCRIBE_LIST_STORAGE_KEY = 'subscribe_list'
const SUBSCRIBE_DETAIL_STORAGE_KEY = 'subscribe_detail'

export default {
  name: nsp,

  state: {
    inited: false,
    list: [],
  },

  effects: (dispatch) => {
    return {
      load() {
        const list = storage.get(SUBSCRIBE_LIST_STORAGE_KEY)
        this.setState({list, inited: true})
      },

      persist(payload, rootState) {
        const {list} = this.state
        storage.set(SUBSCRIBE_LIST_STORAGE_KEY, list)
      },

      init(payload, rootState) {
        const {inited} = this.state
        if (inited) return
        this.load()
      },

      check({url, name, editItemIndex}, rootState) {
        let {list} = this.state

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
        const {list} = this.state
        const newlist = [...list, item]
        this.setState({list: newlist})
        this.persist()
      },

      edit(item, rootState) {
        const {list} = this.state
        const newlist = [...list]
        const {url, name, editItemIndex} = item
        newlist[editItemIndex] = {url, name}

        this.setState({list: newlist})
        this.persist()
      },

      async update(payload, rootState) {
        const {item, index} = payload
        const {url, name} = item
        const servers = await subscribeToClash({url, force: true})
        console.log(servers)
      },

      del(index, rootState) {
        const {list} = this.state
        const newlist = [...list]
        newlist.splice(index, 1)
        this.setState({list: newlist})
      },
    }
  },
}
