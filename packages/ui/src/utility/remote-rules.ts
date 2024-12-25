import { appCacheDir } from '$ui/common'
import { type RemoteRuleItem } from '$ui/define'
import fse from 'fs-extra'
import path from 'path'
import { readUrlWithCache } from './remote'

// use cacheDir because this is cleanable
// you can recover from url settings
export function externalFileForRuleItem(id: string) {
  return path.join(appCacheDir, `remote-rule-content/${id}.yml`)
}

async function saveRomoteRuleItem(id: string, content: string) {
  const file = externalFileForRuleItem(id)
  await fse.outputFile(file, content, 'utf8')
}

export async function getRuleItemContent(id: string) {
  const file = externalFileForRuleItem(id)
  if (!(await fse.pathExists(file))) return ''
  return fse.readFile(file, 'utf8')
}

export async function updateRemoteConfig(item: RemoteRuleItem, forceUpdate = false) {
  const { url } = item
  const { text: content, byRequest } = await readUrlWithCache(url, forceUpdate)

  // save
  await saveRomoteRuleItem(item.id, content)
  if (byRequest) item.updatedAt = Date.now()

  return { byRequest }
}
