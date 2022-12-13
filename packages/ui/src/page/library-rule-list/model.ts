import { RuleItem } from '$ui/common/define'
import { valtioState } from '$ui/common/model/valtio-helper'
import { onInit, onReload } from '$ui/page/global-model'
import storage from '$ui/storage'
import { updateRemoteConfig, updateRemoteRuleProvider } from '$ui/util/remote-rules'
import { message } from 'antd'
import _ from 'lodash'
import { restartAutoUpdate, scheduleAutoUpdate, stopAutoUpdate } from './model.auto-update'

const RULE_LIST_STORAGE_KEY = 'rule_list'

// remove legacy remote.item.content | remote-rule-provider.item.payload
// these content may be long long
// AND lag electron-store from get/set
function cleanUpLegacyFields(list: RuleItem[]) {
  list.forEach((item) => {
    if (item.type === 'remote' || item.type === 'remote-rule-provider') {
      // @ts-ignore
      delete item.content
      // @ts-ignore
      delete item.payload
    }
  })
}

const { state, load, init } = valtioState(
  {
    list: [] as RuleItem[],
  },
  {
    load() {
      const list = storage.get(RULE_LIST_STORAGE_KEY)
      cleanUpLegacyFields(list)
      return { list }
    },
    persist(val) {
      cleanUpLegacyFields(val.list)
      storage.set(RULE_LIST_STORAGE_KEY, val.list)
    },
  }
)

export { state }
export const actions = { check, add, del, edit, updateRemote }

/**
 * listeners
 */

onInit(() => {
  init()
  // wait all init done
  process.nextTick(() => {
    scheduleAutoUpdate()
  })
})
onReload(load)

/**
 * effects
 */

function check({
  item,
  editItemIndex,
}: {
  item: RuleItem
  editItemIndex: number | null | undefined
}) {
  let { list } = state
  if (editItemIndex || editItemIndex === 0) {
    list = _.filter(list, (i, index) => index !== editItemIndex)
  }

  const { type, name } = item
  if (_.find(list, { name })) {
    return 'name已存在'
  }
  if (type === 'remote' || type === 'remote-rule-provider') {
    if (_.find(list, { url: item.url })) {
      return 'url已存在'
    }
  }

  if (type === 'local') {
    // do not check content
    // we don't care
  }
  if (type === 'remote') {
    //
  }
  if (type === 'remote-rule-provider') {
    //
  }
}

function add({ item }: { item: RuleItem }) {
  state.list.push(item)
  restartAutoUpdate(item)
}

function edit({ item, editItemIndex }: { item: RuleItem; editItemIndex: number }) {
  state.list[editItemIndex] = item
  restartAutoUpdate(item)
}

function del(index: number) {
  stopAutoUpdate(state.list[index])
  state.list.splice(index, 1)
}

export async function updateRemote({
  item,
  forceUpdate = false,
  silent = false,
}: {
  item: RuleItem
  forceUpdate?: boolean
  silent?: boolean
}) {
  const type = item.type
  if (type === 'local') return

  let byRequest = false

  if (type === 'remote') {
    ;({ byRequest } = await updateRemoteConfig(item, forceUpdate)) // why config, because this url can return a partial clash config
  }
  if (type === 'remote-rule-provider') {
    ;({ byRequest } = await updateRemoteRuleProvider(item, forceUpdate))
  }

  if (byRequest && !silent) {
    message.success(`更新 ${item.name} 成功`)
  }
}
