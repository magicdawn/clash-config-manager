import _ from 'lodash'
import {message} from 'antd'
import {Action, action, Thunk, thunk, ThunkOn, thunkOn} from 'easy-peasy'
import {subscribeToClash} from '@util/fn/clash'
import {Subscribe} from '@define'
import {StoreModel} from '@store'
import storage from '@storage'
import {setStateFactory, SetStatePayload} from '@common/model/setState'

const SUBSCRIBE_LIST_STORAGE_KEY = 'subscribe_list'
const SUBSCRIBE_DETAIL_STORAGE_KEY = 'subscribe_detail'

interface IState {
  inited: boolean
  list: Subscribe[]
  detail: any
}

export default new (class SubscribeModel implements IState {
  /**
   * state
   */

  inited = false
  list = []
  detail = {}

  /**
   * helper
   */

  setState: Action<SubscribeModel, SetStatePayload<IState>> = setStateFactory<SubscribeModel>()

  load: Thunk<SubscribeModel> = thunk((actions) => {
    const list = storage.get(SUBSCRIBE_LIST_STORAGE_KEY)
    const detail = storage.get(SUBSCRIBE_DETAIL_STORAGE_KEY)
    actions.setState({inited: true, list, detail})
  })

  init: Thunk<SubscribeModel> = thunk((actions, payload, {getState}) => {
    const {inited} = getState()
    if (inited) return
    actions.load()
  })

  persist: Thunk<SubscribeModel> = thunk((actions, payliad, {getState}) => {
    const {list, detail} = getState()
    storage.set(SUBSCRIBE_LIST_STORAGE_KEY, list)
    storage.set(SUBSCRIBE_DETAIL_STORAGE_KEY, detail)
  })

  check: Thunk<SubscribeModel, {url: string; name: string; editItemIndex: number}> = thunk(
    (actions, payload, {getState}) => {
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
    }
  )

  add: Thunk<SubscribeModel, Subscribe> = thunk((actions, payload) => {
    actions.setState(({list}) => {
      list.push(payload)
    })
    actions.persist()
  })

  edit: Thunk<SubscribeModel, Subscribe & {editItemIndex: number}> = thunk((actions, payload) => {
    const {url, name, id, editItemIndex} = payload
    actions.setState(({list}) => {
      list[editItemIndex] = {url, name, id}
    })
    actions.persist()
  })

  del: Thunk<SubscribeModel, number> = thunk((actions, index) => {
    actions.setState(({list}) => {
      list.splice(index, 1)
    })
    actions.persist()
  })

  update: Thunk<SubscribeModel, {url: string; silent?: boolean}> = thunk(
    async (actions, payload) => {
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
    }
  )

  onInit: ThunkOn<SubscribeModel, any, StoreModel> = thunkOn(
    (actions, storeActions) => storeActions.global.init,
    (actions) => {
      actions.init()
    }
  )

  onReload: ThunkOn<SubscribeModel, any, StoreModel> = thunkOn(
    (actions, storeActions) => storeActions.global.reload,
    (actions) => {
      actions.load()
    }
  )
})()
