import { ConfigItem, RuleItem, Subscribe } from '$ui/common/define'
import { valtioState } from '$ui/common/model/valtio-helper'
import { onInit, onReload } from '$ui/page/global-model'
import storage from '$ui/storage'
const CURRENT_CONFIG_STORAGE_KEY = 'current_config_v2'

interface IState {
  list: ConfigItem[]
  name: string
  forceUpdate: boolean
}

const { state, load, init } = valtioState<IState>(
  {
    list: [],
    name: '',
    forceUpdate: true,
  },
  {
    load() {
      return storage.get(CURRENT_CONFIG_STORAGE_KEY)
    },
    persist(val) {
      storage.set(CURRENT_CONFIG_STORAGE_KEY, val)
    },
  }
)

const actions = { currentConfigUsingAndEnabled }

export { state, actions }

// listeners
onInit(init)
onReload(load)

export function currentConfigUsingAndEnabled(item: Subscribe | RuleItem) {
  const using = state.list.find((x) => x.id === item.id)
  return using && !using.disabled
}
