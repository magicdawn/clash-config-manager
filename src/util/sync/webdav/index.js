import memo from 'memoize-one'
import webdav from 'webdav'
import store from '../../../store.js'
import storage from '../../../storage/index.js'

const newClient = memo((davServerUrl, user, pass) => {
  return webdav.createClient(davServerUrl, {
    username: user,
    password: pass,
  })
})

export function getClient() {
  const {davServerUrl, user, pass} = store.getState().preference?.syncConfig || {}
  return newClient(davServerUrl, user, pass)
}

const APP_DATA_DIR = '/AppData/clash-config-manager'
const STORAGE_FILE = APP_DATA_DIR + '/data.json'

export async function _upload() {}

export async function exists(c) {
  c ??= await getClient()
  try {
    return await c.exists(STORAGE_FILE)
  } catch (e) {
    return false
  }
}

export async function download() {
  const c = await getClient()
  const remoteHasData = await exists(c)

  // 远程无数据
  if (!remoteHasData) {
    console.error('remoteData is empty')
    return
  }

  const remoteData = await c.getFileContents(STORAGE_FILE, {format: 'text'})
  const values = typeof remoteData === 'string' ? JSON.parse(remoteData) : remoteData

  // set to electron-store
  storage.store = values

  window.location.reload()

  // redux-store
  // store.dispatch('global/reload')
}

export async function upload() {
  const c = await getClient()
  const localData = {...storage.store}
  const remoteHasData = await exists(c)

  // 远程无数据
  if (!remoteHasData) {
    await c.createDirectory('/AppData/')
    await c.createDirectory(APP_DATA_DIR)
    await c.putFileContents(STORAGE_FILE, JSON.stringify(localData))
    return
  }

  // 合并数据
  const remoteData = await c.getFileContents(STORAGE_FILE, {format: 'text'})
  // TODO: 合并策略
  const data = {...remoteData, ...localData}

  return c.putFileContents(STORAGE_FILE, JSON.stringify(data))
}
