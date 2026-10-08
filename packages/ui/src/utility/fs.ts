import { access } from 'node:fs/promises'
import { hfs } from '@humanfs/node'

export function outputJson(file: string, value: any) {
  return hfs.write(file, JSON.stringify(value, null, 2))
}

export async function exists(path: string) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}
