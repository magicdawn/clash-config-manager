import { createStore, createTypedHooks } from 'easy-peasy'
import { useMemo } from 'react'
import shallowEqual from 'shallowequal'
import * as models from './models'

function getModels<T>(models: T) {
  const ret = {}
  Object.entries(models).forEach(([key, val]) => {
    ret[key] = { ...val } // easy-peasy need model slice as Plain Object
  })
  return ret as T
}

const store = createStore(getModels(models))
export default store
export type StoreModel = typeof models

if (import.meta.hot) {
  import.meta.hot.accept('./models', (models) => {
    store.reconfigure(getModels(models)) // 👈 Here is the magic
  })
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
      // @ts-ignore
      ...state,
      ...actions,
    }
  }, [state, actions])
}

// init on start
process.nextTick(() => {
  store.dispatch.global.init()
})

// FIXME
global.easyStore = store
