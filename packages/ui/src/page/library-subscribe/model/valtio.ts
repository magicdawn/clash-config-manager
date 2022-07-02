import _ from 'lodash'
import { message } from 'antd'
import { subscribeToClash } from '@ui/util/fn/clash'
import { Subscribe } from '@ui/common/define'
import storage from '@ui/storage'
import { proxy, subscribe } from 'valtio'

const SUBSCRIBE_LIST_STORAGE_KEY = 'subscribe_list'
const SUBSCRIBE_DETAIL_STORAGE_KEY = 'subscribe_detail'

interface IState {
  inited: boolean
  list: Subscribe[]
  detail: Record<string, any>
}

export const state = proxy({
  inited: false,
  list: [],
  detail: {},
} as IState)

export const actions = {
  load,
  init,
  check,
  add,
  edit,
  del,
  update,
}

export const listeners = {
  onInit,
  onReload,
}

function setState(update: Partial<IState>) {
  Object.assign(state, update)
}

let persistWatching = false
subscribe(state, () => {
  if (!persistWatching) return
  storage.set(SUBSCRIBE_LIST_STORAGE_KEY, state.list)
  storage.set(SUBSCRIBE_DETAIL_STORAGE_KEY, state.detail)
})

function load() {
  persistWatching = false // turn off watch-and-persist
  const list = storage.get(SUBSCRIBE_LIST_STORAGE_KEY)
  const detail = storage.get(SUBSCRIBE_DETAIL_STORAGE_KEY)
  setState({ inited: true, list, detail })

  // turn on watch-and-persist after setState listener called
  // 这样写上面的 load 之后的第一次 persistWatching 就是 false
  Promise.resolve().then(() => {
    persistWatching = true
  })
}

function init() {
  const { inited } = state
  if (inited) return
  load()
}

function check(payload: { url: string; name: string; editItemIndex: number }) {
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

  // const list = store.list.slice()
  // list[editItemIndex] = { url, name, id, excludeKeywords }
  // setState({ list })
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

  // const detail = { ...store.detail, [url]: servers }
  // setState({ detail })
  state.detail[url] = servers
}

/**
 * listeners
 */

function onInit() {
  init()
}
function onReload() {
  load()
}
