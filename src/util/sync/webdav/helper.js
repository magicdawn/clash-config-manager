import memo from 'memoize-one'
import webdav from 'webdav'
import {dirname} from 'path'
import {Modal, message} from 'antd'
import store from '../../../store.js'
import storage from '../../../storage/index.js'
import customMerge from './customMerge'

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

class DavHelper {
  get client() {
    return getClient()
  }

  #getDirLevels = (dir) => {
    const ret = []
    let cur = dir
    do {
      ret.unshift(cur)
      cur = dirname(cur)
    } while (cur !== '/')
    return ret
  }

  #confirm = (what) => {
    return new Promise((resolve) => {
      Modal.confirm({
        title: what,
        onOk() {
          resolve(true)
        },
        onCancel() {
          resolve(false)
        },
      })
    })
  }

  ensureDir = async () => {
    const dirs = this.#getDirLevels(APP_DATA_DIR)
    for (let d of dirs) {
      // 已存在, 不会报错
      await this.client.createDirectory(d)
    }
  }

  read = async () => {
    const fileContent = await this.client.getFileContents(STORAGE_FILE, {format: 'text'})
    const jsonStr = Buffer.from(fileContent, 'base64').toString('utf8')
    const json = JSON.parse(jsonStr)
    return json
  }
  write = async (json) => {
    const jsonStr = JSON.stringify(json, null, 2)
    const base64Str = Buffer.from(jsonStr).toString('base64')
    await this.client.putFileContents(STORAGE_FILE, base64Str)
  }

  exists = async (path = STORAGE_FILE) => {
    try {
      return await this.client.exists(path)
    } catch (e) {
      return false
    }
  }

  download = async () => {
    const remoteHasData = await this.exists()

    // 远程无数据
    if (!remoteHasData) {
      console.error('remoteData is empty')
      return
    }

    const values = await this.read()
    // TODO: 合并策略

    // set to electron-store
    storage.store = values

    window.location.reload()

    // redux-store
    // store.dispatch('global/reload')
  }

  upload = async () => {
    const localData = storage.store
    const remoteHasData = await this.exists()

    // 远程无数据
    if (!remoteHasData) {
      await this.ensureDir()
      await this.write(localData)
      message.success('备份成功')
      return
    }

    const yes = await this.#confirm('远程已存在, 将智能合并, 确认继续?')
    if (!yes) return
    const remoteData = await this.read()

    // 合并数据
    const data = customMerge(remoteData, localData)
    console.log('customMerge', {remoteData, localData, merged: data})

    await this.write(data)
    message.success('备份成功')
  }

  forceUpload = async () => {
    const yes = await this.#confirm('确认要上传并覆盖')
    if (!yes) {
      return
    }

    const data = storage.store
    const remoteHasData = await this.exists()

    if (!remoteHasData) {
      await this.ensureDir()
    }

    await this.write(data)
    message.success('备份成功')
  }
}

export default new DavHelper()
