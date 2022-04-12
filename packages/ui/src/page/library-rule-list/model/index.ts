import _ from 'lodash'
import { message } from 'antd'
import storage from '@ui/storage'
import { subscribeToClash } from '@ui/util/fn/clash'
import { thunk, thunkOn } from 'easy-peasy'
import { Action, Thunk, ThunkOn } from 'easy-peasy'
import { RuleItem } from '@ui/common/define'
import { StoreModel } from '@ui/store'
import { setStateFactory, SetStatePayload } from '@ui/common/model/setState'

const RULE_LIST_STORAGE_KEY = 'rule_list'

interface IState {
  inited: boolean
  list: RuleItem[]
  detail: any
}

export default {
  ...new (class M implements IState {
    inited = false
    list: RuleItem[] = []
    detail = {}

    /**
     * reducers
     */

    setState: Action<M, SetStatePayload<IState>> = setStateFactory()

    /**
     * listeners
     */

    onInit: ThunkOn<M, any, StoreModel> = thunkOn(
      (_, storeActions) => storeActions.global.init,
      (actions) => {
        actions.init()
      }
    )
    onReload: ThunkOn<M, any, StoreModel> = thunkOn(
      (_, storeActions) => storeActions.global.reload,
      (actions) => {
        actions.load()
      }
    )

    /**
     * effects
     */

    init: Thunk<M> = thunk((actions, _, { getState }) => {
      const { inited } = getState()
      if (inited) return
      actions.load()
    })

    load: Thunk<M> = thunk((actions) => {
      const list = storage.get(RULE_LIST_STORAGE_KEY)
      actions.setState({ inited: true, list })
    })

    persist: Thunk<M> = thunk((actions, _, { getState }) => {
      const { list } = getState()
      storage.set(RULE_LIST_STORAGE_KEY, list)
    })

    check: Thunk<M, { editItemIndex: number; item: RuleItem }> = thunk(
      (actions, payload, { getState }) => {
        const { item, editItemIndex } = payload
        let { list } = getState()
        if (editItemIndex || editItemIndex === 0) {
          list = _.filter(list, (i, index) => index !== editItemIndex)
        }
        const { type, name, url } = item
        if (_.find(list, { name })) {
          return 'name已存在'
        }
        if (type === 'remote') {
          if (_.find(list, { url })) {
            return 'url已存在'
          }
        }
        if (type === 'local') {
          // do not check content
          // we don't care
        }
      }
    )

    add: Thunk<M, { item: RuleItem }> = thunk((actions, { item }) => {
      actions.setState(({ list }) => void list.push(item))
      actions.persist()
    })

    edit: Thunk<M, { item: RuleItem; editItemIndex: number }> = thunk(
      (actions, { item, editItemIndex }) => {
        actions.setState(({ list }) => void (list[editItemIndex] = item))
        actions.persist()
      }
    )

    del: Thunk<M, number> = thunk((actions, index) => {
      actions.setState(({ list }) => void list.splice(index, 1))
      actions.persist()
    })

    update: Thunk<M, { item: RuleItem; index: number }> = thunk(async (actions, payload) => {
      const { item } = payload
      const { url } = item
      let servers
      try {
        servers = await subscribeToClash({ url, forceUpdate: true })
      } catch (e) {
        message.error('更新出错: \n' + e.stack || e)
        throw e
      }
      message.success('更新成功')
      actions.setState(({ detail }) => {
        detail[url] = servers
      })
      actions.persist()
    })
  })(),
}
