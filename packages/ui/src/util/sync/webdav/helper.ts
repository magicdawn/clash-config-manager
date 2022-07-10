import storage from '$ui/storage'
import { rootActions, rootState } from '$ui/store'
import { message, Modal } from 'antd'
import { dirname } from 'path'
import { createClient } from 'webdav'
import customMerge from './customMerge'
import memo from 'memoize-one'

const makeClient = memo((davServerUrl: string, username: string, password: string) =>
  createClient(davServerUrl, {
    username,
    password,
  })
)

function getClient() {
  const { davServerUrl, user, pass } = rootState.preference?.syncConfig || {}
  return makeClient(davServerUrl, user, pass)
}

const APP_DATA_DIR = '/AppData/clash-config-manager'
const STORAGE_FILE = APP_DATA_DIR + '/data.txt'

class DavHelper {
  get client() {
    return getClient()
  }

  // 获取所有的 dir 层级, 如 input = '/AppData/clash-config-manager/'
  // levels = [/AppData, /AppData/clash-config-manager/]
  // client.createDirectory recursive 不生效 2022-07-10
  private getDirLevels(dir: string) {
    const ret: string[] = []
    let cur = dir
    do {
      ret.unshift(cur)
      cur = dirname(cur)
    } while (cur !== '/')
    return ret
  }

  private confirm(what: string): Promise<boolean> {
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

  async ensureDir(d = APP_DATA_DIR) {
    for (const d of this.getDirLevels(APP_DATA_DIR)) {
      await this.client.createDirectory(d)
    }
  }

  async read() {
    const fileContent = (await this.client.getFileContents(STORAGE_FILE, {
      format: 'text',
    })) as string
    const jsonStr = Buffer.from(fileContent, 'base64').toString('utf8')
    const json = JSON.parse(jsonStr)
    return json
  }
  async write(json: any) {
    const jsonStr = JSON.stringify(json, null, 2)
    const base64Str = Buffer.from(jsonStr).toString('base64')
    await this.client.putFileContents(STORAGE_FILE, base64Str, { overwrite: true })
  }

  async exists(path = STORAGE_FILE) {
    // 如果 dir 不存在, 会报错 status code 409
    try {
      return await this.client.exists(path)
    } catch (e) {
      return false
    }
  }

  async upload() {
    const localData = storage.store
    const remoteHasData = await this.exists()

    // 远程无数据
    if (!remoteHasData) {
      await this.ensureDir()
      await this.write(localData)
      message.success('备份成功')
      return
    }

    const yes = await this.confirm('远程已存在, 将智能合并, 确认继续?')
    if (!yes) return
    const remoteData = await this.read()

    // 合并数据
    const data = customMerge(remoteData, localData)
    console.log('customMerge', { remoteData, localData, merged: data })

    await this.write(data)
    message.success('备份成功')
  }

  async forceUpload() {
    const yes = await this.confirm('确认要上传并覆盖')
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

  async download() {
    const remoteHasData = await this.exists()

    // 远程无数据
    if (!remoteHasData) {
      console.error('remoteData is empty')
      return
    }

    const yes = await this.confirm('将智能合并, 确认继续?')
    if (!yes) return

    const remoteData = await this.read()
    const localData = { ...storage.store }
    const merged = customMerge(localData, remoteData)
    console.log('customMerge', { remoteData, localData, merged })

    // reload electron-store & react global store
    storage.store = merged
    rootActions.global.reload()
    message.success('下载成功')
  }

  async forceDownload() {
    const yes = await this.confirm('确认要上传并覆盖')
    if (!yes) {
      return
    }

    const data = await this.read()

    // reload electron-store & react store
    storage.store = data
    rootActions.global.reload()
    message.success('下载成功')
  }
}

export default new DavHelper()
