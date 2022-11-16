import { valtioState } from '$ui/common/model/valtio-helper'
import { onInit, onReload } from '$ui/page/global-model'
import storage from '$ui/storage'

const STORAGE_KEY = 'preference'

interface IState {
  syncConfig: {
    davServerUrl: string
    user: string
    pass: string
  }
  vscodeTheme?: string
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
