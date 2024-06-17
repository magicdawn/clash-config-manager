import { __DEV__ } from '$ui/common'
import { ConfigItem, RuleItem, Subscribe } from '$ui/define'
import { onInit, onReload } from '$ui/modules/global-model'
import storage from '$ui/storage'
import { valtioState } from '$ui/utility/valtio-helper'
import _ from 'lodash'

const CURRENT_CONFIG_STORAGE_KEY = 'current_config_v2'

interface IState {
  list: ConfigItem[]
  name: string
  clashMeta: boolean
  generateAllProxyGroup: boolean
  generateSubNameProxyGroup: boolean
  generatedGroupNameLang: string
  generatedGroupNameEmoji: boolean
}

const defaultState: IState = {
  list: [],
  name: '',
  generateAllProxyGroup: false,
  generateSubNameProxyGroup: false,
  clashMeta: false,
  generatedGroupNameLang: 'zh',
  generatedGroupNameEmoji: true,
}

const allowedKeys = Object.keys(defaultState)

const { state, load, init } = valtioState<IState>(
  { ...defaultState },
  {
    load() {
      return {
        ...defaultState,
        ..._.pick(storage.get(CURRENT_CONFIG_STORAGE_KEY), allowedKeys),
      }
    },
    persist(val) {
      if (__DEV__) {
        // hot-reload 之后都消失了
        if (!val.list.length) {
          return
        }
      }

      storage.set(CURRENT_CONFIG_STORAGE_KEY, _.pick(val, allowedKeys))
    },
  },
)

const actions = { currentConfigUsingAndEnabled }

export { actions, state }

// listeners
onInit(init)
onReload(load)

/**
 * 用于 auto-update 判断
 */
export function currentConfigUsingAndEnabled(item: Subscribe | RuleItem) {
  const using = state.list.find((x) => x.id === item.id)
  return using && !using.disabled
}
