import { valtioState } from '$ui/common/model/valtio-helper'
import { onInit, onReload } from '$ui/page/global-model'
import storage from '$ui/storage'

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
}

const { state, init, load } = valtioState<IState>(
  {
    syncConfig: {
      davServerUrl: 'https://dav.jianguoyun.com/dav/',
      user: '',
      pass: '',
    },
    vscodeTheme: '',
  },
  {
    load() {
      return storage.get(STORAGE_KEY)
    },
    persist(val) {
      storage.set(STORAGE_KEY, val)
    },
  }
)

export { state }

/**
 * listeners
 */

onInit(init)
onReload(load)
