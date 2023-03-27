import { ClashProxyItem } from '$clash-utils'
import { Subscribe } from '$ui/common/define'
import { valtioState } from '$ui/common/model/valtio-helper'
import { onInit, onReload } from '$ui/page/global-model'
import storage from '$ui/storage'
import { subscribeToClash } from '$ui/util/subscribe'
import { message } from 'antd'
import { find, isEqual, pick, uniqWith } from 'lodash'
import { ref } from 'valtio'
import { restartAutoUpdate, scheduleAutoUpdate, stopAutoUpdate } from './model.auto-update'
import { nodefreeGetUrls } from './special/nodefree'

const SUBSCRIBE_LIST_STORAGE_KEY = 'subscribe_list'
const SUBSCRIBE_DETAIL_STORAGE_KEY = 'subscribe_detail'
const SUBSCRIBE_STATUS_STORAGE_KEY = 'subscribe_status'

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
      const detail = pick(
        storage.get(SUBSCRIBE_DETAIL_STORAGE_KEY) || ({} as IState['detail']),
        list.map((item) => item.url).filter(Boolean)
      )
      for (const [url, servers] of Object.entries(detail)) {
        servers?.forEach((s) => ref(s)) // do not observe server object
      }

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
  stopAutoUpdate(state.list[index].id)
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

  let servers: ClashProxyItem[] = []
  let status: string | undefined

  // special nodefree
  if (currentSubscribe.specialType === 'nodefree') {
    const urls = nodefreeGetUrls(currentSubscribe)
    if (!urls.length) return
    servers = (
      await Promise.all(
        urls.map(async (url) => {
          let currentServers: ClashProxyItem[] = []
          let err: Error | undefined
          try {
            ;({ servers: currentServers } = await subscribeToClash({ url, forceUpdate }))
          } catch (e) {
            err = e
          }
          if (err) {
            console.error('nodefree %s failed', url, err)
          }
          return currentServers
        })
      )
    ).flat()

    if (!servers.length) {
      message.error('更新订阅出错: 所有链接均未返回节点')
      return
    }

    // uniq
    servers = uniqWith(servers, isEqual)

    // name 处理
    servers.forEach((s) => {
      s.name = s.name.replace(/^[-_]/, '')
    })

    // name 不能是 duplicate
    const names = new Set<string>()
    servers.forEach((item) => {
      if (!names.has(item.name)) {
        names.add(item.name)
        return
      }

      let i = 1
      let newName = () => item.name + ` (DUP-${i})`
      while (names.has(newName())) i++

      item.name = newName()
      names.add(item.name)
    })
  }

  // normal
  else {
    try {
      ;({ servers, status } = await subscribeToClash({ url, forceUpdate }))
    } catch (e) {
      message.error('更新订阅出错: \n' + e.stack || e)
      throw e
    }
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
  servers.forEach((s) => ref(s)) // prevent observe server inner
  state.detail[url] = servers
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
  // wait all init done
  process.nextTick(() => {
    scheduleAutoUpdate()
  })
})
onReload(load)

function toggleUrlVisible(index: number) {
  const cur = state.list[index]?.urlVisible ?? true
  state.list[index].urlVisible = !cur
}
