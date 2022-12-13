import { RemoteRuleItem, RemoteRuleProviderRuleItem } from '$ui/common/define'
import { YAML } from '$ui/libs'
import * as remote from '@electron/remote'
import fse from 'fs-extra'
import path from 'path'
import { readUrlWithCache } from './remote'

const userDataPath = remote.app.getPath('userData')
export function externalFileForRuleItem(id: string) {
  return path.join(userDataPath, `data-rule-${id}.yml`) // close to data.json
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
