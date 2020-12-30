import _ from 'lodash'
import {message} from 'antd'
import storage from '@storage'
import {subscribeToClash} from '@util/fn/clash'
import {action, thunk, thunkOn} from 'easy-peasy'
import {Action, Thunk, ThunkOn} from 'easy-peasy'
import {RuleItem} from '@define'
import {StoreModel} from '@store'
import {SetState, setState} from '@common/model/setState'

const nsp = 'libraryRuleList'
const RULE_LIST_STORAGE_KEY = 'rule_list'

interface IState {
  inited: boolean
  list: RuleItem[]
}

interface IModel extends IState {
  onInit: ThunkOn<IModel, any, StoreModel>
  onReload: ThunkOn<IModel, any, StoreModel>

  init: Thunk<IModel>
  load: Thunk<IModel>
  persist: Thunk<IModel>
  setState: SetState<IModel, IState>

  // check: Thunk<IModel, RuleItem & {editItemIndex: number}>
}

const model: IModel = {
  inited: false,
  list: [],

  onInit: thunkOn(
    (_, storeActions) => storeActions.global.init,
    (actions) => {
      actions.init()
    }
  ),
  onReload: thunkOn(
    (_, storeActions) => storeActions.global.init,
    (actions) => {
      actions.load()
    }
  ),

  init: thunk((actions, _, {getState}) => {
    const {inited} = getState()
    if (inited) return
    actions.load()
  }),
  load: thunk((actions) => {
    const list = storage.get(RULE_LIST_STORAGE_KEY)
    actions.setState({inited: true, list})
  }),
  persist: thunk((actions, _, {getState}) => {
    const {list} = getState()
    storage.set(RULE_LIST_STORAGE_KEY, list)
  }),
  setState: setState(),
}

export default model

const bak = {
  name: nsp,

  state: {
    inited: false,
    list: [],
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
        const list = storage.get(RULE_LIST_STORAGE_KEY)
        this.setState({inited: true, list})
      },

      persist(payload, rootState) {
        const {list, detail} = this.state
        storage.set(RULE_LIST_STORAGE_KEY, list)
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
