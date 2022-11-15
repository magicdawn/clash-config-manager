import { RuleItem } from '$ui/common/define'
import { valtioState } from '$ui/common/model/valtio-helper'
import { onInit, onReload } from '$ui/page/global-model'
import storage from '$ui/storage'
import { updateRemoteConfig, updateRemoteRuleProvider } from '$ui/util/remote-rules'
import { message } from 'antd'
import _ from 'lodash'

const RULE_LIST_STORAGE_KEY = 'rule_list'

const { state, load, init } = valtioState(
  {
    list: [] as RuleItem[],
    detail: {} as Record<string, any>,
  },
  {
    load() {
      return { list: storage.get(RULE_LIST_STORAGE_KEY), detail: {} }
    },
    persist(val) {
      storage.set(RULE_LIST_STORAGE_KEY, val.list)
    },
  }
)

export { state }
export const actions = { check, add, del, edit, updateRemote }

/**
 * listeners
 */

onInit(init)
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
}

function edit({ item, editItemIndex }: { item: RuleItem; editItemIndex: number }) {
  state.list[editItemIndex] = item
}

function del(index: number) {
  state.list.splice(index, 1)
}

async function updateRemote(item: RuleItem, forceUpdate = false) {
  const type = item.type
  if (type === 'local') return

  if (type === 'remote') {
    await updateRemoteConfig(item, forceUpdate) // why config, because this url can return a partial clash config
  }
  if (type === 'remote-rule-provider') {
    await updateRemoteRuleProvider(item, forceUpdate)
  }

  message.success(`更新 ${item.name} 成功`)
}
