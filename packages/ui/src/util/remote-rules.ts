import { RemoteRuleItem, RemoteRuleProviderRuleItem } from '$ui/common/define'
import { YAML } from '$ui/libs'
import { readUrlWithCache } from './remote'

export async function updateRemoteConfig(item: RemoteRuleItem, forceUpdate = false) {
  const { url } = item
  const { text: content, byRequest } = await readUrlWithCache(url, forceUpdate)

  // save
  item.content = content
  if (byRequest) item.updatedAt = Date.now()

  return { byRequest }
}

export async function updateRemoteRuleProvider(
  item: RemoteRuleProviderRuleItem,
  forceUpdate = false
) {
  const { url } = item

  const { text: content, byRequest } = await readUrlWithCache(url, forceUpdate)
  const payload: string[] = (YAML.load(content) as { payload: string[] }).payload
  if (!payload || !Array.isArray(payload)) {
    throw new Error('expect {payload: string[]} for rule-provider')
  }

  // save
  item.payload = payload
  if (byRequest) item.updatedAt = Date.now()

  return { byRequest }
}
