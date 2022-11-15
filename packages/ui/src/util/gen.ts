import { ClashConfig, RuleItem, Subscribe } from '$ui/common/define'
import { ProxyGroupType } from '$ui/common/define/ClashConfig'
import { pmap, YAML } from '$ui/libs'
import { rootActions, rootState } from '$ui/store'
import fse from 'fs-extra'
import { homedir } from 'os'
import { join as pathjoin } from 'path'

export function getUsingItems() {
  // subscribe
  const subscribeList = rootState.librarySubscribe.list

  // rule
  const ruleList = rootState.libraryRuleList.list

  // 只放 {type, id}
  const { list: resultList } = rootState.currentConfig

  // 具体 item
  const resultItemList = resultList
    .filter((x) => !x.disabled) // remove toggle off item
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

  const subscribeItems = resultItemList
    .filter((x) => x?.type === 'subscribe')
    .map((x) => x?.item) as Subscribe[]

  const ruleItems = resultItemList
    .filter((x) => x?.type === 'rule')
    .map((x) => x?.item) as RuleItem[]

  return { subscribeItems, ruleItems }
}

export default async function genConfig({ forceUpdate = false }: { forceUpdate?: boolean } = {}) {
  const { name } = rootState.currentConfig
  const { subscribeItems, ruleItems } = getUsingItems()

  /**
   * config merge
   */
  let config: Partial<ClashConfig> = {}
  const updateConfig = (partial: Partial<ClashConfig>) => {
    const { rules, ...otherConfig } = partial
    // reverse: GUI最前面的优先
    config = { ...otherConfig, ...config, rules: [...(config.rules || []), ...(rules || [])] }
  }

  // 批量更新远程规则
  const remoteRuleItems = ruleItems.filter(
    (item) => item.type === 'remote' || item.type === 'remote-rule-provider'
  )
  await pmap(
    remoteRuleItems,
    async (item) => {
      await rootActions.libraryRuleList.updateRemote({ item, forceUpdate })
    },
    5
  )

  for (const item of ruleItems) {
    const { type } = item

    if (type === 'local') {
      const partial = YAML.load(item.content) as Partial<ClashConfig>
      updateConfig(partial)
      continue
    }

    if (type === 'remote') {
      const content = item.content!
      const partial = YAML.load(content) as Partial<ClashConfig>
      updateConfig(partial)
      continue
    }

    if (type === 'remote-rule-provider') {
      const { payload = [], providerBehavior, providerPolicy } = item

      let rules: string[]
      if (providerBehavior === 'classical') {
        rules = payload.map((s) => `${s},${providerPolicy}`)
      } else if (providerBehavior === 'domain') {
        rules = payload.map((s) => `DOMAIN,${s},${providerPolicy}`)
      } else {
        rules = payload.map((s) => {
          if (s.includes(':')) {
            return `IP-CIDR6,${s},${providerPolicy}`
          } else {
            return `IP-CIDR,${s},${providerPolicy}`
          }
        })
      }

      updateConfig({ rules })
      continue
    }
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

  // batch update subscribe
  await pmap(
    subscribeItems,
    (item) =>
      rootActions.librarySubscribe.update({
        url: item.url,
        silent: true,
        forceUpdate,
      }),
    5
  )

  for (const item of subscribeItems) {
    const { url } = item
    let servers = rootState.librarySubscribe.detail[url] || []
    config.proxies = config.proxies.concat(servers)
  }

  /**
   * 自动处理 proxy group
   */

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

  // final rules
  // 未匹配使用 DIRECT
  if (!config.rules?.at(-1)?.startsWith('MATCH,')) {
    config.rules?.push('MATCH,DIRECT')
  }

  const configYaml = YAML.dump(config)
  const file = getConfigFile(name)
  await fse.outputFile(file, configYaml)

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
