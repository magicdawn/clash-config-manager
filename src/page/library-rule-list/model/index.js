import _ from 'lodash'
import storage from '../../../storage/index'
import {subscribeToClash} from '../../../util/fn/clash'
import {message} from 'antd'

const nsp = 'libraryRuleList'
const SUBSCRIBE_LIST_STORAGE_KEY = 'rule_list'

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
        this.setState({inited: true, list})
      },

      persist(payload, rootState) {
        const {list, detail} = this.state
        storage.set(SUBSCRIBE_LIST_STORAGE_KEY, list)
      },

      init(payload, rootState) {
        const {inited} = this.state
        if (inited) return
        this.load()
      },

      check({item, editItemIndex}, rootState) {
        let {list} = this.state

        if (editItemIndex || editItemIndex === 0) {
          list = _.filter(list, (i, index) => index !== editItemIndex)
        }

        const {type, name, url, content} = item

        if (_.find(list, {name})) {
          return 'name已存在'
        }

        if (type === 'remote') {
          if (_.find(list, {url})) {
            return 'url已存在'
          }
        }

        if (type === 'local') {
          // do not check content
          // we don't care
        }
      },

      add({item}, rootState) {
        this.setState(({list}) => void list.push(item))
        this.persist()
      },

      edit({item, editItemIndex}, rootState) {
        this.setState(({list}) => void (list[editItemIndex] = item))
        this.persist()
      },

      del(index, rootState) {
        this.setState(({list}) => void list.splice(index, 1))
        this.persist()
      },

      async update(payload, rootState) {
        const {item, index} = payload
        const {url, name} = item

        let servers
        try {
          servers = await subscribeToClash({url, force: true})
        } catch (e) {
          message.error('更新出错: \n' + e.stack || e)
          throw e
        }

        message.success('更新成功')
        this.setState(({detail}) => {
          detail[url] = servers
        })
        this.persist()
      },
    }
  },
}
