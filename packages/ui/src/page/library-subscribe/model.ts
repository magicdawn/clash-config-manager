import _ from 'lodash'
import { message } from 'antd'
import { subscribeToClash } from '$ui/util/fn/clash'
import { Subscribe } from '$ui/common/define'
import storage from '$ui/storage'
import { valtioState } from '$ui/common/model/valtio-helper'
import { onInit, onReload } from '$ui/page/global-model'

const SUBSCRIBE_LIST_STORAGE_KEY = 'subscribe_list'
const SUBSCRIBE_DETAIL_STORAGE_KEY = 'subscribe_detail'

interface IState {
  list: Subscribe[]
  detail: Record<string, any>
}

const { state, load, init } = valtioState<IState>(
  {
    list: [],
    detail: {},
  },
  {
    persist(val) {
      storage.set(SUBSCRIBE_LIST_STORAGE_KEY, val.list)
      storage.set(SUBSCRIBE_DETAIL_STORAGE_KEY, val.detail)
    },
    load() {
      const list = storage.get(SUBSCRIBE_LIST_STORAGE_KEY)
      const detail = storage.get(SUBSCRIBE_DETAIL_STORAGE_KEY)
      return { list, detail }
    },
  }
)
export { state }

export const actions = {
  load,
  init,
  check,
  add,
  edit,
  del,
  update,
}

function check(payload: { url: string; name: string; editItemIndex?: number | null }) {
  const { url, name, editItemIndex } = payload

  let { list } = state
  if (editItemIndex || editItemIndex === 0) {
    list = _.filter(list, (i, index) => index !== editItemIndex)
  }
  if (_.find(list, { url })) {
    return 'url已存在'
  }
  if (_.find(list, { name })) {
    return 'name已存在'
  }
}

function add(payload: Subscribe) {
  state.list.push(payload)
}

function edit(payload: Subscribe & { editItemIndex: number }) {
  const { url, name, id, editItemIndex, excludeKeywords } = payload
  state.list[editItemIndex] = { url, name, id, excludeKeywords }
}

function del(index: number) {
  state.list.splice(index, 1)
}

async function update(payload: { url: string; silent?: boolean; forceUpdate?: boolean }) {
  const { url, silent = false, forceUpdate: forceUpdate = false } = payload
  // TODO: ts
  let servers: any[]
  try {
    servers = await subscribeToClash({ url, forceUpdate })
  } catch (e) {
    message.error('更新订阅出错: \n' + e.stack || e)
    throw e
  }

  const keywords = state.list.find((item) => item.url === url)?.excludeKeywords || []
  if (keywords.length) {
    for (const keyword of keywords) {
      servers = servers.filter((server) => server.name && !server.name.includes(keyword))
    }
  }

  if (!silent) {
    message.success('更新订阅成功')
  }

  state.detail[url] = servers
}

/**
 * listeners
 */

// listeners
onInit(init)
onReload(load)
