import _ from 'lodash'
import { Action, computed, Computed, thunk, Thunk, thunkOn, ThunkOn } from 'easy-peasy'
import storage from '@ui/storage'
import { ConfigItem } from '@ui/common/define'
import { setStateFactory, SetStatePayload } from '@ui/common/model/setState'
import { StoreModel } from '@ui/store'

const CURRENT_CONFIG_STORAGE_KEY = 'current_config_v2'

interface IState {
  inited: boolean
  list: ConfigItem[]
  name: string
  forceUpdate: boolean
}

export default new (class M implements IState {
  inited = false
  list = []
  name = ''
  forceUpdate = true

  setState: Action<M, SetStatePayload<IState>> = setStateFactory()

  // for test computed
  listCount: Computed<M, number> = computed((state) => {
    return state.list.length
  })

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

  load: Thunk<M> = thunk((actions) => {
    const storeValues = storage.get(CURRENT_CONFIG_STORAGE_KEY)
    actions.setState({ inited: true, ...storeValues })
  })

  persist: Thunk<M> = thunk((actions, payload, { getState }) => {
    storage.set(CURRENT_CONFIG_STORAGE_KEY, _.omit(getState(), ['inited']))
  })

  init: Thunk<M> = thunk((actions, _, { getState }) => {
    const { inited } = getState()
    if (inited) return
    actions.load()
  })

  modifyList: Thunk<M, (list: ConfigItem[]) => void> = thunk((actions, payload) => {
    actions.changeState((slice) => {
      payload(slice.list)
    })
  })

  changeState: Thunk<M, SetStatePayload<IState>> = thunk((actions, payload) => {
    actions.setState(payload)
    actions.persist()
  })
})()
