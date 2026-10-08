import path from 'node:path'
import { hfs } from '@humanfs/node'
import { appCacheDir } from '$ui/common'
import { readUrlWithCache } from './remote'
import type { RemoteRuleItem } from '$ui/types'

// use cacheDir because this is cleanable
// you can recover from url settings
export function externalFileForRuleItem(id: string) {
  return path.join(appCacheDir, `remote-rule-content/${id}.yml`)
}

async function saveRomoteRuleItem(id: string, content: string) {
  const file = externalFileForRuleItem(id)
  await hfs.write(file, content)
}

export async function getRuleItemContent(id: string) {
  const file = externalFileForRuleItem(id)
  return (await hfs.text(file)) ?? ''
}

export async function updateRemoteConfig(item: RemoteRuleItem, forceUpdate = false) {
  const { url } = item
  const { text: content, byRequest } = await readUrlWithCache(url, forceUpdate)

  // save
  await saveRomoteRuleItem(item.id, content)
  if (byRequest) item.updatedAt = Date.now()

  return { byRequest }
}
