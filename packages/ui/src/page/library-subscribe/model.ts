import { ClashProxyItem } from '$clash-utils'
import { Subscribe } from '$ui/common/define'
import { valtioState } from '$ui/common/model/valtio-helper'
import { onInit, onReload } from '$ui/page/global-model'
import storage from '$ui/storage'
import { subscribeToClash } from '$ui/util/subscribe'
import { message } from 'antd'
import { runCommand } from '$ui/commands/run'
import { find, once, pick } from 'lodash'
import ms from 'ms'
import { ref } from 'valtio'
import { restartAutoUpdate, scheduleAutoUpdateOnce } from './model.auto-update'

const SUBSCRIBE_LIST_STORAGE_KEY = 'subscribe_list'
const SUBSCRIBE_DETAIL_STORAGE_KEY = 'subscribe_detail'
const SUBSCRIBE_STATUS_STORAGE_KEY = 'subscrine_status'

interface IState {
  list: Subscribe[]
  detail: Record<string, ClashProxyItem[] | undefined | null>
  status: Record<string, string> // 订阅状态
}

const { state, load, init } = valtioState<IState>(
  {
    list: [],
    detail: {},
    status: {},
  },
  {
    persist(val) {
      storage.set(SUBSCRIBE_LIST_STORAGE_KEY, val.list)
      storage.set(SUBSCRIBE_STATUS_STORAGE_KEY, val.status)
      // 只保留当前 list 存在的订阅
      const detail = pick(val.detail, val.list.map((item) => item.url).filter(Boolean))
      storage.set(SUBSCRIBE_DETAIL_STORAGE_KEY, detail)
    },

    load() {
      const list = storage.get(SUBSCRIBE_LIST_STORAGE_KEY) || []
      const status: Record<string, string> = storage.get(SUBSCRIBE_STATUS_STORAGE_KEY) || {}

      // 只保留当前 list 存在的订阅
      const detail = ref(
        pick(
          storage.get(SUBSCRIBE_DETAIL_STORAGE_KEY) || ({} as IState['detail']),
          list.map((item) => item.url).filter(Boolean)
        )
      )

      return { list, detail, status }
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
  toggleUrlVisible,
}

function check(payload: { url: string; name: string; editItemIndex?: number | null }) {
  const { url, name, editItemIndex } = payload

  let { list } = state
  if (editItemIndex || editItemIndex === 0) {
    list = state.list.filter((i, index) => index !== editItemIndex)
  }
  if (find(list, { url })) {
    return 'url已存在'
  }
  if (find(list, { name })) {
    return 'name已存在'
  }
}

function add(payload: Subscribe) {
  state.list.push(payload)
  restartAutoUpdate(payload)
}

function edit(payload: Subscribe & { editItemIndex: number }) {
  const { editItemIndex, ...subscribeItem } = payload

  // bak & save
  const previousSubscribeItem = state.list[editItemIndex]
  state.list[editItemIndex] = subscribeItem

  if (
    previousSubscribeItem.autoUpdateInterval !== subscribeItem.autoUpdateInterval ||
    previousSubscribeItem.autoUpdate !== subscribeItem.autoUpdate
  ) {
    restartAutoUpdate(subscribeItem)
  }
}

function del(index: number) {
  state.list.splice(index, 1)
}

export async function update({
  url,
  silent = false,
  successMsg,
  forceUpdate = false,
}: {
  url: string
  silent?: boolean
  successMsg?: string
  forceUpdate?: boolean
}) {
  const currentSubscribe = state.list.find((s) => s.url === url)
  if (!currentSubscribe) return

  let servers: ClashProxyItem[]
  let status: string | undefined
  try {
    ;({ servers, status } = await subscribeToClash({ url, forceUpdate }))
  } catch (e) {
    message.error('更新订阅出错: \n' + e.stack || e)
    throw e
  }

  const keywords = currentSubscribe?.excludeKeywords || []
  if (keywords.length) {
    for (const keyword of keywords) {
      servers = servers.filter((server) => server.name && !server.name.includes(keyword))
    }
  }

  if (!silent || successMsg) {
    const msg =
      successMsg ||
      (currentSubscribe?.name ? `订阅(${currentSubscribe.name}) 更新成功` : `订阅更新成功`)
    message.success(msg)
  }

  // save
  if (currentSubscribe) currentSubscribe.updatedAt = Date.now()
  state.detail[url] = ref(servers)
  restartAutoUpdate(currentSubscribe)

  // 经过网络更新, status 一定是 string, 可能是空 string
  if (typeof status !== 'undefined') {
    state.status[url] = status || ''
  }
}

/**
 * listeners
 */

onInit(() => {
  init()
  scheduleAutoUpdateOnce()
})
onReload(load)

function toggleUrlVisible(index: number) {
  const cur = state.list[index]?.urlVisible ?? true
  state.list[index].urlVisible = !cur
}
