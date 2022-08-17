import { app, path, fs } from '@tauri-apps/api'

interface IOpts<T> {
  name: string
  encryptionKey?: string
  defaults: T
}

async function getStoreFile(name: string) {
  return await path.join(await path.dataDir(), await app.getName(), name + '.json')
}

async function nextTick() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(null))
  })
}

export class TauriStore<T> {
  data: T

  private opts: IOpts<T>

  constructor(opts: IOpts<T>) {
    this.opts = opts
    this.data = opts.defaults
  }

  #storeFile: string
  private async ensureStoreFile() {
    if (!this.#storeFile) {
      this.#storeFile = await getStoreFile(this.opts.name)
    }
    return this.#storeFile
  }

  get(key: string) {
    return this.data[key]
  }

  async set(key: string, val: any) {
    this.data[key] = val
    await nextTick()
    await this.persist()
  }

  private async persist() {
    await this.ensureStoreFile()
    await fs.writeTextFile(this.#storeFile, this.serialize())
  }
  private async loadFromFile() {
    await this.ensureStoreFile()
    const str = await fs.readTextFile(this.#storeFile)
    const json = this.deserialize(str)
    this.data = json
  }

  private serialize() {
    const str = JSON.stringify(this.data)
    // TODO: add aes encrypt
    return str
  }
  private deserialize(str: string) {
    // TODO: add aes decrypt
    return JSON.parse(str)
  }
}
