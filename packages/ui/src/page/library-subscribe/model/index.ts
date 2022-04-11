import _ from 'lodash'
import { message } from 'antd'
import { Action, Thunk, thunk, ThunkOn, thunkOn } from 'easy-peasy'
import { subscribeToClash } from '@ui/util/fn/clash'
import { Subscribe } from '@ui/common/define'
import { StoreModel } from '@ui/store'
import storage from '@ui/storage'
import { setStateFactory, SetStatePayload } from '@ui/common/model/setState'

const SUBSCRIBE_LIST_STORAGE_KEY = 'subscribe_list'
const SUBSCRIBE_DETAIL_STORAGE_KEY = 'subscribe_detail'

interface IState {
  inited: boolean
  list: Subscribe[]
  detail: any
}

export default {
  ...new (class M implements IState {
    /**
     * state
     */

    inited = false
    list = []
    detail = {}

    /**
     * helper
     */

    setState: Action<M, SetStatePayload<IState>> = setStateFactory<M>()

    load: Thunk<M> = thunk((actions) => {
      const list = storage.get(SUBSCRIBE_LIST_STORAGE_KEY)
      const detail = storage.get(SUBSCRIBE_DETAIL_STORAGE_KEY)
      actions.setState({ inited: true, list, detail })
    })

    init: Thunk<M> = thunk((actions, payload, { getState }) => {
      const { inited } = getState()
      if (inited) return
      actions.load()
    })

    persist: Thunk<M> = thunk((actions, payliad, { getState }) => {
      const { list, detail } = getState()
      storage.set(SUBSCRIBE_LIST_STORAGE_KEY, list)
      storage.set(SUBSCRIBE_DETAIL_STORAGE_KEY, detail)
    })

    check: Thunk<M, { url: string; name: string; editItemIndex: number }> = thunk(
      (actions, payload, { getState }) => {
        const { url, name, editItemIndex } = payload

        let { list } = getState()
        if (editItemIndex || editItemIndex === 0) {
          list = _.filter(list, (i, index) => index !== editItemIndex)
        }
        if (_.find(list, { url })) {
          return 'url已存在'
        }
        if (_.find(list, { name })) {
          return 'name已存在'
        }
      }
    )

    add: Thunk<M, Subscribe> = thunk((actions, payload) => {
      actions.setState(({ list }) => {
        list.push(payload)
      })
      actions.persist()
    })

    edit: Thunk<M, Subscribe & { editItemIndex: number }> = thunk((actions, payload) => {
      const { url, name, id, editItemIndex } = payload
      actions.setState(({ list }) => {
        list[editItemIndex] = { url, name, id }
      })
      actions.persist()
    })

    del: Thunk<M, number> = thunk((actions, index) => {
      actions.setState(({ list }) => {
        list.splice(index, 1)
      })
      actions.persist()
    })

    update: Thunk<M, { url: string; silent?: boolean; forceUpdate?: boolean }> = thunk(
      async (actions, payload) => {
        const { url, silent = false, forceUpdate: forceUpdate = false } = payload
        // TODO: ts
        let servers: any[]
        try {
          servers = await subscribeToClash({ url, forceUpdate })
        } catch (e) {
          message.error('更新订阅出错: \n' + e.stack || e)
          throw e
        }

        if (!silent) {
          message.success('更新订阅成功')
        }

        actions.setState(({ detail }) => {
          detail[url] = servers
        })
        actions.persist()
      }
    )

    onInit: ThunkOn<M, any, StoreModel> = thunkOn(
      (actions, storeActions) => storeActions.global.init,
      (actions) => {
        actions.init()
      }
    )

    onReload: ThunkOn<M, any, StoreModel> = thunkOn(
      (actions, storeActions) => storeActions.global.reload,
      (actions) => {
        actions.load()
      }
    )
  })(),
}
