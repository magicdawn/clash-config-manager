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

export default {
  ...new (class M implements IState {
    inited = false
    syncConfig = {
      davServerUrl: '',
      user: '',
      pass: '',
    }

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

    load: Thunk<M> = thunk((actions) => {
      const storeValues = storage.get(STORAGE_KEY)
      actions.setState({ inited: true, ...storeValues })
    })

    persist: Thunk<M> = thunk((actions, payload, { getState }) => {
      storage.set(STORAGE_KEY, _.omit(getState(), ['inited']))
    })

    init: Thunk<M> = thunk((actions, payload, { getState }) => {
      const { inited } = getState()
      if (inited) return
      actions.load()
    })
  })(),
}
