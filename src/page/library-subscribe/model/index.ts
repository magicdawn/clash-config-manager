import _ from 'lodash'
import {message} from 'antd'
import {Action, action, Thunk, thunk, ThunkOn, thunkOn} from 'easy-peasy'
import {Subscribe} from '@define'
import {StoreModel} from '@store'
import storage from '@/storage/index'
import {subscribeToClash} from '@/util/fn/clash'

const SUBSCRIBE_LIST_STORAGE_KEY = 'subscribe_list'
const SUBSCRIBE_DETAIL_STORAGE_KEY = 'subscribe_detail'

interface IState {
  inited: boolean
  list: Subscribe[]
  detail: any
}

type SetStatePayload = Partial<IState> | ((state: IState) => IState | undefined | void)

interface IModel extends IState {
  setState: Action<IModel, SetStatePayload>
  load: Thunk<IModel>
  init: Thunk<IModel>
  persist: Thunk<IModel>

  check: Thunk<IModel, {url: string; name: string; editItemIndex: number}>
  add: Thunk<IModel, Subscribe>
  edit: Thunk<IModel, Subscribe & {editItemIndex: number}>
  del: Thunk<IModel, number>
  update: Thunk<IModel, {url: string; silent?: boolean}>

  onInit: ThunkOn<IModel, any, StoreModel>
  onReload: ThunkOn<IModel, any, StoreModel>
}

const model: IModel = {
  inited: false,
  list: [],
  detail: {},

  /**
   * reducer
   */

  setState: action((state, payload) => {
    if (typeof payload === 'object') {
      Object.assign(state, payload)
      return
    }

    if (typeof payload === 'function') {
      const ret = payload(state)
      return ret
    }
  }),

  /**
   * effects
   */

  load: thunk((actions) => {
    const list = storage.get(SUBSCRIBE_LIST_STORAGE_KEY)
    const detail = storage.get(SUBSCRIBE_DETAIL_STORAGE_KEY)
    actions.setState({inited: true, list, detail})
  }),

  persist: thunk((actions, payliad, {getState}) => {
    const {list, detail} = getState()
    storage.set(SUBSCRIBE_LIST_STORAGE_KEY, list)
    storage.set(SUBSCRIBE_DETAIL_STORAGE_KEY, detail)
  }),

  init: thunk((actions, payload, {getState}) => {
    const {inited} = getState()
    if (inited) return
    actions.load()
  }),

  check: thunk((actions, payload, {getState}) => {
    const {url, name, editItemIndex} = payload

    let {list} = getState()
    if (editItemIndex || editItemIndex === 0) {
      list = _.filter(list, (i, index) => index !== editItemIndex)
    }
    if (_.find(list, {url})) {
      return 'url已存在'
    }
    if (_.find(list, {name})) {
      return 'name已存在'
    }
  }),

  add: thunk((actions, payload) => {
    actions.setState(({list}) => {
      list.push(payload)
    })
    actions.persist()
  }),

  edit: thunk((actions, payload) => {
    const {url, name, id, editItemIndex} = payload
    actions.setState(({list}) => {
      list[editItemIndex] = {url, name, id}
    })
    actions.persist()
  }),

  del: thunk((actions, index) => {
    actions.setState(({list}) => {
      list.splice(index, 1)
    })
    actions.persist()
  }),

  update: thunk(async (actions, payload) => {
    const {url, silent = false} = payload
    // TODO: ts
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

    actions.setState(({detail}) => {
      detail[url] = servers
    })
    actions.persist()
  }),

  /**
   * listener
   */

  onInit: thunkOn(
    (actions, storeActions) => storeActions.global.init,
    (actions) => {
      actions.init()
    }
  ),

  onReload: thunkOn(
    (actions, storeActions) => storeActions.global.reload,
    (actions) => {
      actions.load()
    }
  ),
}
export default model
