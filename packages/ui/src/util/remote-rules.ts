import { appCacheDir } from '$ui/common'
import { RemoteRuleItem, RemoteRuleProviderRuleItem } from '$ui/define'
import { YAML } from '$ui/libs'
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

export async function updateRemoteRuleProvider(
  item: RemoteRuleProviderRuleItem,
  forceUpdate = false
) {
  const { url } = item
  const { text: content, byRequest } = await readUrlWithCache(url, forceUpdate)

  // validate
  const payload: string[] = (YAML.load(content) as { payload: string[] }).payload
  if (!payload || !Array.isArray(payload)) {
    throw new Error('expect {payload: string[]} for rule-provider')
  }

  // save
  await saveRomoteRuleItem(item.id, content)
  if (byRequest) item.updatedAt = Date.now()

  return { byRequest }
}
