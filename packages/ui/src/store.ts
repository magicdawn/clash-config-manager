import _ from 'lodash'
import { createStore, createTypedHooks } from 'easy-peasy'
import { useMemo } from 'react'
import shallowEqual from 'shallowequal'
import * as models from './models'

const getModels = <T>(models: T) =>
  _.cloneDeepWith(models, (val) => {
    if (val && typeof val === 'object' && val.constructor !== Object) {
      return { ...val } // if it's a Model instance, make it plain object
    }
  }) as T

const store = createStore(getModels(models))
export default store
export type StoreModel = typeof models

if (process.env.NODE_ENV === 'development') {
  if ((module as any).hot) {
    ;(module as any).hot.accept('./models', () => {
      store.reconfigure(getModels(models)) // 👈 Here is the magic
    })
  }
}

const { useStore, useStoreActions, useStoreDispatch, useStoreState } =
  createTypedHooks<StoreModel>()
export { useStore, useStoreActions, useStoreDispatch, useStoreState }

export const useEasyState = <NSP extends keyof StoreModel>(nsp: NSP) => {
  const state = useStoreState((state) => state[nsp], shallowEqual)
  return state
}
export const useEasyActions = <NSP extends keyof StoreModel>(nsp: NSP) => {
  const actions = useStoreActions((actions) => {
    return actions[nsp]
  })
  return actions
}
export const useEasy = <NSP extends keyof StoreModel>(nsp: NSP) => {
  const state = useEasyState(nsp)
  const actions = useEasyActions(nsp)
  return useMemo(() => {
    return {
      ...state,
      ...actions,
    }
  }, [state, actions])
}

// init on start
process.nextTick(() => {
  store.dispatch.global.init()
})
