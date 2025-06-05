import { isEqual, pick, uniqWith } from 'es-toolkit'
import { ref } from 'valtio'
import { fse } from '$ui/libs'
import { onInit, onReload } from '$ui/modules/global-model'
import storage from '$ui/storage'
import { message } from '$ui/store'
import { subscribeToClash } from '$ui/utility/subscribe'
import { valtioState } from '$ui/utility/valtio-helper'
import type { ClashProxyItem } from '$clash-utils'
import type { Subscribe } from '$ui/types'
import { nodefreeGetUrls } from './special/nodefree'
import { restartAutoUpdate, scheduleAutoUpdate, stopAutoUpdate } from './store.auto-update'

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
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        storage.get(SUBSCRIBE_DETAIL_STORAGE_KEY) || ({} as IState['detail']),
        list.map((item) => item.url).filter(Boolean),
      )
      for (const [url, servers] of Object.entries(detail)) {
        servers?.forEach((s) => ref(s)) // do not observe server object
      }

      return { list, detail, status }
    },
  },
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
  if (list.find((x) => x.url === url)) {
    return 'url已存在'
  }
  if (list.find((x) => x.name === name)) {
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
  idOrUrl,
  silent = false,
  successMsg,
  forceUpdate = false,
}: {
  idOrUrl: string
  silent?: boolean
  successMsg?: string
  forceUpdate?: boolean
}) {
  const index = state.list.findIndex((s) => s.id === idOrUrl || s.url === idOrUrl)
  if (index === -1) return
  let currentSubscribe = state.list[index]

  // update `proxyUrls`
  {
    const { useSubConverter, proxyUrlsFromExternalFile, subConverterUrl } = currentSubscribe
    if (useSubConverter && proxyUrlsFromExternalFile) {
      const serviceUrl = subConverterUrl || SubConverterServiceUrls[0]
      if (!(await fse.exists(proxyUrlsFromExternalFile))) {
        throw new Error(`proxyUrlsFromExternalFile ${proxyUrlsFromExternalFile} 不存在`)
      }
      const proxyUrls = await fse.readFile(proxyUrlsFromExternalFile, 'utf8')
      const url = getConvertedUrl(proxyUrls, serviceUrl)
      if (url !== currentSubscribe.url) {
        const newSubscribe = { ...currentSubscribe, proxyUrls, url }
        state.list[index] = newSubscribe
        currentSubscribe = newSubscribe
      }
    }
  }

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
            ;({ servers: currentServers } = await subscribeToClash({
              url,
              forceUpdate,
              ua: currentSubscribe.ua,
            }))
          } catch (e) {
            err = e
          }
          if (err) {
            console.error('nodefree %s failed', url, err)
          }
          return currentServers
        }),
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
      const newName = () => `${item.name} (DUP-${i})`
      while (names.has(newName())) i++

      item.name = newName()
      names.add(item.name)
    })
  }

  // normal
  else {
    try {
      ;({ servers, status } = await subscribeToClash({
        url: currentSubscribe.url,
        forceUpdate,
        ua: currentSubscribe.ua,
      }))
    } catch (e) {
      message.error(`更新订阅出错: \n${e.stack || e}`, 10)
      throw e
    }
  }

  const keywords = currentSubscribe?.excludeKeywords || []
  if (keywords.length) {
    for (const keyword of keywords) {
      servers = servers.filter((server) => server.name && !server.name.includes(keyword))
    }
  }

  if (currentSubscribe.addPrefixToProxies) {
    servers.forEach((s) => {
      s.name = `${currentSubscribe.name} - ${s.name}`
    })
  }

  /**
   * hysteris2 特殊处理
   */
  servers.forEach((_s) => {
    const s = _s as any
    if (s.type === 'hysteria2' && s.obfs && s.obfs === 'none') {
      s.obfs = ''
    }
  })

  if (!silent || successMsg) {
    const msg = successMsg || (currentSubscribe?.name ? `订阅(${currentSubscribe.name}) 更新成功` : `订阅更新成功`)
    message.success(msg)
  }

  // save
  if (currentSubscribe) currentSubscribe.updatedAt = Date.now()
  servers.forEach((s) => ref(s)) // prevent observe server inner
  state.detail[idOrUrl] = servers
  restartAutoUpdate(currentSubscribe)

  // 经过网络更新, status 一定是 string, 可能是空 string
  if (typeof status !== 'undefined') {
    state.status[idOrUrl] = status || ''
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

export const SubConverterServiceUrls = ['https://api.ytools.cc/sub']

export function getConvertedUrl(sub: string, converter: string) {
  const subUrlJoined = sub
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !(line.startsWith('#') || line.startsWith(';')))
    .join('|')
  const params = new URLSearchParams({
    // TODO: figure out these fields means
    target: 'clash',
    insert: 'false',
    config: 'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Full_NoAuto.ini',
    append_type: 'true',
    emoji: 'true',
    list: 'true',
    xudp: 'false',
    udp: 'true',
    tfo: 'false',
    expand: 'true',
    scv: 'true', // skip-cert-verify
    fdn: 'false',
    new_name: 'true',
    url: subUrlJoined,
  })

  const u = new URL(converter)
  u.search = params.toString()
  return u.href
}
