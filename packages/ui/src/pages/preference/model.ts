import { onInit, onReload } from '$ui/modules/global-model'
import { client } from '$ui/modules/rpc-client'
import storage from '$ui/storage'
import { valtioState } from '$ui/utility/valtio-helper'

const STORAGE_KEY = 'preference'

export const themes = ['light', 'dark', 'follow-system'] as const
export type Theme = typeof themes extends ReadonlyArray<infer T> ? T : never

interface IState {
  syncConfig: {
    davServerUrl: string
    user: string
    pass: string
  }
  vscodeTheme?: string
  theme?: Theme
  useSystemProxy?: boolean
}

const { state, init, load } = valtioState<IState>(
  {
    syncConfig: {
      davServerUrl: 'https://dav.jianguoyun.com/dav/',
      user: '',
      pass: '',
    },
    vscodeTheme: '',
    useSystemProxy: false,
  },
  {
    load() {
      return storage.get(STORAGE_KEY)
    },
    persist(val) {
      storage.set(STORAGE_KEY, val)
    },
  },
)

export { state }

/**
 * listeners
 */

onInit(init)
onInit(() => {
  client.setUseSystemProxy(!!state.useSystemProxy)
})
onReload(load)
