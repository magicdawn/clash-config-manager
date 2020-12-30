import {cloneDeep} from 'lodash'
import {createStore, createTypedHooks} from 'easy-peasy'
import {useMemo} from 'react'
import shallowEqual from 'shallowequal'
import * as models from './models'

const store = createStore(cloneDeep(models))
export default store
export type StoreModel = typeof models

if (process.env.NODE_ENV === 'development') {
  if ((module as any).hot) {
    ;(module as any).hot.accept('./models', () => {
      store.reconfigure(cloneDeep(models)) // 👈 Here is the magic
    })
  }
}

const {useStore, useStoreActions, useStoreDispatch, useStoreState} = createTypedHooks<StoreModel>()
export {useStore, useStoreActions, useStoreDispatch, useStoreState}

export const useEasy = <NSP extends keyof StoreModel>(nsp: NSP) => {
  const state = useStoreState((state) => state[nsp], shallowEqual)
  const actions = useStoreActions((actions) => actions[nsp])
  return useMemo(() => {
    return {
      ...state,
      ...actions,
    }
  }, [state, actions])
}
