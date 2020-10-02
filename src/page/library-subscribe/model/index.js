import _ from 'lodash'
import storage from '../../../storage/index'
import {subscribeToClash} from '../../../util/fn/clash'
import {message} from 'antd'

const nsp = 'librarySubscribe'
const SUBSCRIBE_LIST_STORAGE_KEY = 'subscribe_list'
const SUBSCRIBE_DETAIL_STORAGE_KEY = 'subscribe_detail'

export default {
  name: nsp,

  state: {
    inited: false,
    list: [],
    detail: {},
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
        const list = storage.get(SUBSCRIBE_LIST_STORAGE_KEY)
        const detail = storage.get(SUBSCRIBE_DETAIL_STORAGE_KEY)
        this.setState({inited: true, list, detail})
      },

      persist(payload, rootState) {
        const {list, detail} = this.state
        storage.set(SUBSCRIBE_LIST_STORAGE_KEY, list)
        storage.set(SUBSCRIBE_DETAIL_STORAGE_KEY, detail)
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
        this.setState(({list}) => {
          list.push(item)
        })
        this.persist()
      },

      edit(item, rootState) {
        const {url, name, id, editItemIndex} = item
        this.setState(({list}) => {
          list[editItemIndex] = {url, name, id}
        })
        this.persist()
      },

      async update({url, silent} = {silent: false}, rootState) {
        let servers
        try {
          servers = await subscribeToClash({url, force: true})
        } catch (e) {
          message.error('更新订阅出错: \n' + e.stack || e)
          throw e
        }

        if (!silent) {
          message.success('更新订阅成功')
        }

        this.setState(({detail}) => {
          detail[url] = servers
        })
        this.persist()
      },

      del(index, rootState) {
        this.setState(({list}) => {
          list.splice(index, 1)
        })
        this.persist()
      },
    }
  },
}
