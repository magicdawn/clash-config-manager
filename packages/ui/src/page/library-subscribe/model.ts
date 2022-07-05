import { runCommand } from '$ui/commands/run'
import { Subscribe } from '$ui/common/define'
import { valtioState } from '$ui/common/model/valtio-helper'
import { onInit, onReload } from '$ui/page/global-model'
import storage from '$ui/storage'
import { subscribeToClash } from '$ui/util/fn/clash'
import { message } from 'antd'
import { find, once, pick } from 'lodash'
import ms from 'ms'

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
      // 只保留当前 list 存在的订阅
      const detail = pick(val.detail, val.list.map((item) => item.url).filter(Boolean))
      storage.set(SUBSCRIBE_DETAIL_STORAGE_KEY, detail)
    },
    load() {
      const list = storage.get(SUBSCRIBE_LIST_STORAGE_KEY) || []

      // 只保留当前 list 存在的订阅
      const detail = pick(
        storage.get(SUBSCRIBE_DETAIL_STORAGE_KEY) || {},
        list.map((item) => item.url).filter(Boolean)
      )
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
}

function edit(payload: Subscribe & { editItemIndex: number }) {
  const { editItemIndex, ...subscribeItem } = payload
  state.list[editItemIndex] = subscribeItem
}

function del(index: number) {
  state.list.splice(index, 1)
}

async function update({
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

  // TODO: ts
  let servers: any[]
  try {
    servers = await subscribeToClash({ url, forceUpdate })
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

  if (currentSubscribe) currentSubscribe.updatedAt = Date.now()

  // TODO: 会影响 electron-store 保存么?
  // state.detail[url] = ref(servers)
  state.detail[url] = servers
}

/**
 * listeners
 */

// listeners

const scheduleAutoUpdateOnce = once(scheduleAutoUpdate)
onInit(() => {
  init()
  scheduleAutoUpdateOnce()
})
onReload(load)

/**
 * auto update
 */

const timerRegistry: Record<string, NodeJS.Timer | undefined> = {}

async function scheduleAutoUpdate() {
  for (const sub of state.list) {
    const { name, url, autoUpdate, autoUpdateInterval, updatedAt: lastUpdated } = sub
    if (!autoUpdate || !autoUpdateInterval) continue

    const run = async () => {
      await update({
        url,
        forceUpdate: true,
        successMsg: `自动更新订阅: ${name} 更新成功`,
      })
      await runCommand('generate')
    }

    const interval = ms(autoUpdateInterval + 'h')

    // 启动时更新
    // 使用场景: 定时12小时更新, 退出了, 第二天打开自动更新, 但当天重启不会更新
    if (!lastUpdated || Date.now() >= lastUpdated + interval) {
      await run()
    }

    if (timerRegistry[name]) {
      clearInterval(timerRegistry[name])
      timerRegistry[name] = undefined
    }
    timerRegistry[name] = setInterval(async () => {
      await run()
    }, interval)
  }
}
