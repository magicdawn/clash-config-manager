import { onInit, onReload } from '$ui/modules/global-model'
import storage from '$ui/storage'
import { message } from '$ui/store'
import { updateRemoteConfig } from '$ui/utility/remote-rules'
import { valtioState } from '$ui/utility/valtio-helper'
import { restartAutoUpdate, scheduleAutoUpdate, stopAutoUpdate } from './model.auto-update'
import type { RuleItem } from '$ui/types'

const RULE_LIST_STORAGE_KEY = 'rule_list'

// remove legacy remote.item.content
// these content may be long long
// AND lag electron-store from get/set
function cleanUpLegacyFields(list: RuleItem[]) {
  list.forEach((item) => {
    if (item.type === 'remote') {
      // @ts-ignore
      delete item.content
    }
  })
}

// 2023-10-17 移除 type=remote-rule-provider 支持
// 这里做一下清理
function getTidyList(list: RuleItem[]): RuleItem[] {
  const list2 = list.filter((x) => x.type === 'local' || x.type === 'remote')
  cleanUpLegacyFields(list2)
  return list2
}

const { state, load, init } = valtioState(
  {
    list: [] as RuleItem[],
  },
  {
    load() {
      let list = storage.get(RULE_LIST_STORAGE_KEY)
      list = getTidyList(list)
      return { list }
    },
    persist(val) {
      const list = getTidyList(val.list)
      storage.set(RULE_LIST_STORAGE_KEY, list)
    },
  },
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

function check({ item, editItemIndex }: { item: RuleItem; editItemIndex: number | null | undefined }) {
  let { list } = state
  if (editItemIndex || editItemIndex === 0) {
    list = list.filter((i, index) => index !== editItemIndex)
  }

  const { type, name } = item
  if (list.find((x) => x.name === name)) {
    return 'name已存在'
  }
  if (type === 'remote' && list.find((x) => 'url' in x && x.url === item.url)) {
    return 'url已存在'
  }

  if (type === 'local') {
    // do not check content
    // we don't care
  }

  if (type === 'remote') {
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

  if (byRequest && !silent) {
    message.success(`更新 ${item.name} 成功`)
  }
}
