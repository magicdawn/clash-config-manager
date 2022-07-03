import { homedir } from 'os'
import { join as pathjoin } from 'path'
import Yaml from 'js-yaml'
import fse from 'fs-extra'
import request from 'umi-request'
import { rootState, rootActions } from '$ui/store'
import { ClashConfig, RuleItem, Subscribe } from '$ui/common/define'
import { ProxyGroupType } from '$ui/common/define/ClashConfig'

export default async function genConfig(options: { forceUpdate?: boolean } = {}) {
  const { forceUpdate = false } = options

  // subscribe
  const subscribeList = rootState.librarySubscribe.list

  // rule
  const ruleList = rootState.libraryRuleList.list

  // 只放 {type, id}
  const { list: resultList, name } = rootState.currentConfig

  // 具体 item
  const resultItemList = resultList
    .map(({ type, id }) => {
      if (type === 'subscribe') {
        const item = subscribeList.find((x) => x.id === id)
        if (item) {
          return { item, type }
        }
      }
      if (type === 'rule') {
        const item = ruleList.find((x) => x.id === id)
        if (item) {
          return { item, type }
        }
      }
    })
    .filter(Boolean)

  // reverse: GUI最前面的优先
  const subscribeArr = resultItemList.filter((x) => x?.type === 'subscribe') as {
    item: Subscribe
    type: 'subscribe'
  }[]
  const ruleArr = resultItemList.filter((x) => x?.type === 'rule') as {
    item: RuleItem
    type: 'rule'
  }[]

  /**
   * config merge
   */
  let config: Partial<ClashConfig> = {}

  for (const r of ruleArr) {
    const { item } = r
    const { type, url, content } = item
    let usingContent = content

    // remote: url -> content
    if (type === 'remote') {
      usingContent = await request.get(url!, {
        responseType: 'text',
        headers: { 'x-extra-headers': JSON.stringify({ 'user-agent': 'clash' }) },
      })
    }

    if (!usingContent) {
      console.warn('content 为空')
      continue
    }

    const cur = Yaml.load(usingContent)
    const { rules, ...otherConfig } = cur
    config = { ...otherConfig, ...config, rules: [...(config.rules || []), ...(rules || [])] }
  }

  /**
   * subscribe
   */

  if (!config.proxies || !Array.isArray(config.proxies)) {
    config.proxies = []
  }
  if (!config['proxy-groups'] || !Array.isArray(config['proxy-groups'])) {
    config['proxy-groups'] = []
  }

  for (const s of subscribeArr) {
    const { item } = s
    const { url } = item
    let servers

    // update subscribe
    await rootActions.librarySubscribe.update({ url, silent: true, forceUpdate })
    // eslint-disable-next-line prefer-const
    servers = rootState.librarySubscribe.detail[url]
    config.proxies = config.proxies.concat(servers)
  }

  const proxyGroups = config['proxy-groups']
  const allProxies = config.proxies.map((row) => row.name)
  proxyGroups
    .filter((item) => !item.proxies || !Array.isArray(item.proxies) || !item.proxies.length)
    .forEach((item) => {
      item.proxies = allProxies
    })

  const existNames = proxyGroups.map((i) => i.name)
  for (const line of config.rules || []) {
    const use = line.split(',').slice(-1)[0]
    if (!use) continue
    if (['DIRECT', 'REJECT', 'no-resolve'].includes(use)) continue
    if (existNames.includes(use)) continue

    // - {name: Others, type: select, proxies: [DIRECT, Proxy]}
    const newgroup = {
      name: use,
      type: ProxyGroupType.Select,
      proxies: ['DIRECT', 'Proxy', 'REJECT'],
    }
    config['proxy-groups'].push(newgroup)
    existNames.push(use)
  }

  const configYaml = Yaml.safeDump(config)
  const file = getConfigFile(name)
  fse.writeFileSync(file, configYaml)
  console.log(configYaml)
  console.log('[done]: %s writed', file)
  return {
    success: true,
    filename: file,
    msg: `${file} writed`,
  }
}

export const DEFAULT_NAME = 'clash-config-manager'

// default parameter 不能处理空字符串的情况

export function getConfigFile(name?: string) {
  name = name || DEFAULT_NAME
  return pathjoin(homedir(), `.config/clash/${name}.yaml`)
}

export function getConfigFileDisplay(name?: string) {
  name = name || DEFAULT_NAME
  return `~/.config/clash/${name}.yaml`
}
