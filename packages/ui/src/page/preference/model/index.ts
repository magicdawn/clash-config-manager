import _ from 'lodash'
import storage from '@ui/storage'
import { setStateFactory, SetStatePayload } from '@ui/common/model/setState'
import { Action, thunk, Thunk, thunkOn, ThunkOn } from 'easy-peasy'
import { StoreModel } from '@ui/store'

const nsp = 'preference'
const STORAGE_KEY = nsp

interface IState {
  inited: boolean
  syncConfig: {
    davServerUrl: string
    user: string
    pass: string
  }
}

export default new (class Model implements IState {
  inited = false
  syncConfig = {
    davServerUrl: '',
    user: '',
    pass: '',
  }

  setState: Action<Model, SetStatePayload<IState>> = setStateFactory()

  /**
   * listeners
   */

  onInit: ThunkOn<Model, any, StoreModel> = thunkOn(
    (_, storeActions) => storeActions.global.init,
    (actions) => {
      actions.init()
    }
  )
  onReload: ThunkOn<Model, any, StoreModel> = thunkOn(
    (_, storeActions) => storeActions.global.reload,
    (actions) => {
      actions.load()
    }
  )

  load: Thunk<Model> = thunk((actions) => {
    const storeValues = storage.get(STORAGE_KEY)
    actions.setState({ inited: true, ...storeValues })
  })

  persist: Thunk<Model> = thunk((actions, payload, { getState }) => {
    storage.set(STORAGE_KEY, _.omit(getState(), ['inited']))
  })

  init: Thunk<Model> = thunk((actions, payload, { getState }) => {
    const { inited } = getState()
    if (inited) return
    actions.load()
  })
})()
