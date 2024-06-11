import { ClashConfig, RuleItem, Subscribe } from '$ui/define'
import { ProxyGroupType, ProxyGroupTypeConfig } from '$ui/define/ClashConfig'
import { YAML, pmap } from '$ui/libs'
import { rootActions, rootState } from '$ui/store'
import fse from 'fs-extra'
import _ from 'lodash'
import moment from 'moment'
import { homedir } from 'os'
import { join as pathjoin } from 'path'
import { getRuleItemContent } from './remote-rules'
import { truthy } from './ts-filter'

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

export async function genConfig({ forceUpdate = false }: { forceUpdate?: boolean } = {}) {
  const {
    name,
    clashMeta,
    generateAllProxyGroup,
    generateSubNameProxyGroup,
    generatedGroupNameEmoji,
    generatedGroupNameLang,
  } = rootState.currentConfig
  const { subscribeItems, ruleItems } = getUsingItems()

  // the config
  let config: Partial<ClashConfig> = {}

  // 值为 array 的 key 集合
  type ClashConfigKeysWithArrayValue = NonNullable<
    {
      [k in keyof ClashConfig]: ClashConfig[k] extends any[] ? k : never
    }[keyof ClashConfig]
  >

  const updateConfig = (partial: Partial<ClashConfig>) => {
    const arrayValuedKeys: ClashConfigKeysWithArrayValue[] = ['rules', 'proxies', 'proxy-groups']

    config = {
      ..._.omit(partial, arrayValuedKeys),
      ...config, // GUI最前面的优先
    }

    // 数组类, append
    arrayValuedKeys.forEach((key) => {
      if (partial[key]?.length) {
        // don't know how to handle this in TypeScript
        // @ts-ignore
        config[key] = [
          //
          ...(config[key] || []),
          ...(partial[key] || []),
        ]
      }
    })
  }

  /* #region build proxies */
  if (!Array.isArray(config.proxies)) config.proxies = []
  if (!Array.isArray(config['proxy-groups'])) config['proxy-groups'] = []

  // batch update subscribe
  await pmap(
    subscribeItems,
    (item) =>
      rootActions.librarySubscribe.update({
        url: item.url,
        silent: true,
        forceUpdate,
      }),
    5,
  )

  for (const item of subscribeItems) {
    const { url } = item
    const servers = rootState.librarySubscribe.detail[url] || []
    config.proxies = config.proxies.concat(servers)
  }
  /* #endregion */

  /* #region build rules */
  // 批量更新远程规则
  const remoteRuleItems = ruleItems.filter((item) => item.type === 'remote')
  await pmap(
    remoteRuleItems,
    async (item) => {
      await rootActions.libraryRuleList.updateRemote({ item, forceUpdate })
    },
    5,
  )

  for (const item of ruleItems) {
    const { type } = item

    if (type === 'local') {
      const partial = YAML.load(item.content) as Partial<ClashConfig>
      updateConfig(partial)
      continue
    }

    if (type === 'remote') {
      const content = await getRuleItemContent(item.id)
      const partial = YAML.load(content) as Partial<ClashConfig>
      updateConfig(partial)
      continue
    }
  }
  /* #endregion */

  /* #region proxy-groups */
  // subscribe 自动生成 proxy groups
  const subscribeTragets = subscribeItems.map((sub) => sub.name)

  const genGroupsForSubscribe = (label: string, proxies: string[]) => {
    // 只有单个服务器时, 不用多个 group
    if (proxies.length <= 1) {
      return [
        {
          name: `${generatedGroupNameEmoji ? ProxyGroupTypeConfig[ProxyGroupType.Select].emoji + ' ' : ''}${label}`,
          type: ProxyGroupType.Select,
          proxies,
        },
      ]
    }

    function getName(label: string, type: ProxyGroupType) {
      const emoji = generatedGroupNameEmoji ? ProxyGroupTypeConfig[type].emoji + ' ' : ''

      type AllowedLang = 'zh' | 'en'
      const lang: AllowedLang = (() => {
        const _default = 'zh'
        const allowed: AllowedLang[] = ['zh', 'en']
        if (!generatedGroupNameLang) return _default
        if (!allowed.includes(generatedGroupNameLang)) return _default
        return generatedGroupNameLang as AllowedLang
      })()

      const typeText =
        lang === 'zh' ? ProxyGroupTypeConfig[type].nameZh : ProxyGroupTypeConfig[type].nameEn

      return `${emoji}${label} ${typeText}`
    }

    const withSuffix = [
      {
        name: getName(label, ProxyGroupType.UrlTest),
        type: ProxyGroupType.UrlTest,
        proxies,
        url: 'http://www.gstatic.com/generate_204',
        interval: 150,
      },
      {
        name: getName(label, ProxyGroupType.Fallback),
        type: ProxyGroupType.Fallback,
        proxies,
        url: 'http://www.gstatic.com/generate_204',
        interval: 150,
      },
      {
        name: getName(label, ProxyGroupType.Select),
        type: ProxyGroupType.Select,
        proxies,
      },
    ]

    return [
      generateSubNameProxyGroup
        ? {
            name: label,
            type: ProxyGroupType.Select,
            proxies: withSuffix.map((pg) => pg.name),
          }
        : null,
      ...withSuffix,
    ].filter(truthy)
  }

  const autoGeneratedProxyGroupsForSubscribe = [
    ...(generateAllProxyGroup
      ? genGroupsForSubscribe(
          '所有节点',
          config.proxies.map((p) => p.name),
        )
      : []),
    ...subscribeTragets
      .map((subscribeName, index) => {
        const url = subscribeItems[index].url
        const subscribeProxies = (rootState.librarySubscribe.detail[url] || []).map(
          (server) => server.name,
        )
        return genGroupsForSubscribe(subscribeName, subscribeProxies)
      })
      .flat(),
  ]

  // yaml 中已定义的 proxy-groups
  let proxyGroups = config['proxy-groups']

  // 包含 filter 的 proxy-group
  let filteredGroups = proxyGroups.filter((item) => item.filter)
  filteredGroups.forEach((proxyGroup) => {
    proxyGroup.proxies = (config.proxies || [])
      .filter((server) => server.name.includes(proxyGroup.filter!))
      .map((server) => server.name)
  })
  filteredGroups = filteredGroups.filter((pg) => pg.proxies.length) // filter 完, 若 proxies 为空, 则去除 proxy-group

  const prependProxyGroups = [
    {
      name: 'Proxy',
      type: ProxyGroupType.Select,
      proxies: [
        ...autoGeneratedProxyGroupsForSubscribe.map((proxyGroup) => proxyGroup.name),
        ...filteredGroups.map((proxyGroup) => proxyGroup.name),
      ],
    },
    ...autoGeneratedProxyGroupsForSubscribe,
    ...filteredGroups,
  ]

  // 去除 prepend proxy-groups
  const prependProxyGroupsNames = prependProxyGroups.map((pg) => pg.name)
  proxyGroups = proxyGroups.filter(
    (proxyGroup) => !proxyGroup.filter && !prependProxyGroupsNames.includes(proxyGroup.name),
  )

  // yaml 中写的 proxy-groups
  // 如果没有写 proxies, 则指定为 [DIRECT, Proxy, ...subscribe, ...filtered, REJECT]
  const defaultProxiesForProxyGroup = [
    'DIRECT',
    'Proxy',
    ...autoGeneratedProxyGroupsForSubscribe.map((proxyGroup) => proxyGroup.name),
    ...filteredGroups.map((proxyGroup) => proxyGroup.name),
    'REJECT',
  ]
  proxyGroups
    .filter((item) => !item.proxies || !Array.isArray(item.proxies) || !item.proxies.length)
    .forEach((item) => {
      item.proxies = defaultProxiesForProxyGroup
    })

  // final proxyGroups
  proxyGroups = [...prependProxyGroups, ...proxyGroups]

  const existingProxyGroupNames = proxyGroups.map((item) => item.name)
  const reservedTargets = ['DIRECT', 'REJECT', 'no-resolve']
  const toAddGroups = new Set<string>()

  for (const line of config.rules || []) {
    const use = line.split(',').slice(-1)[0]
    if (!use) continue
    if (reservedTargets.includes(use)) continue
    if (existingProxyGroupNames.includes(use)) continue
    toAddGroups.add(use)
  }

  for (const target of toAddGroups) {
    const newgroup = {
      name: target,
      type: ProxyGroupType.Select,
      proxies: defaultProxiesForProxyGroup,
    }
    proxyGroups.push(newgroup)
  }

  // proxy-providers
  const proxyProviderNames = Object.keys(config['proxy-providers'] || {})
  if (proxyProviderNames.length) {
    proxyGroups.forEach((pg) => {
      if (!pg.proxies.length && !pg.use?.length) {
        pg.use ||= proxyProviderNames
      }
    })
  }

  // done for proxy-groups
  config['proxy-groups'] = proxyGroups

  /* #endregion */

  /* #region premium only feature */
  if (!Object.keys(config['proxy-providers'] || {}).length) {
    delete config['proxy-providers']
  }

  if (!Object.keys(config['rule-providers'] || {}).length) {
    delete config['rule-providers']
  }
  /* #endregion */

  /* #region final rules */
  if (!config.rules?.at(-1)?.startsWith('MATCH,')) {
    // 未匹配使用 DIRECT
    config.rules?.push('MATCH,DIRECT')
  }
  /* #endregion */

  return config
}

export default async function genConfigThenWrite({
  forceUpdate = false,
}: { forceUpdate?: boolean } = {}) {
  const config = await genConfig({ forceUpdate })

  const { name, clashMeta } = rootState.currentConfig
  const configYaml = YAML.dump(config)
  const file = getConfigFile(name, clashMeta)

  let stat: fse.Stats
  const unchangedSkipWrite =
    (await fse.exists(file)) &&
    configYaml === (await fse.readFile(file, 'utf-8')) &&
    (stat = await fse.stat(file)) &&
    moment(stat.mtimeMs).startOf('day').valueOf() === moment().startOf('day').valueOf() // same day

  let writed = false
  let msg: string
  if (unchangedSkipWrite) {
    msg = `无变化, 已跳过生成`
  } else {
    await fse.outputFile(file, configYaml)
    writed = true
    msg = `生成成功: ${file} 已更新`
  }

  console.log(configYaml)
  console.log('[done]: %s writed', file)
  return {
    success: true,
    filename: file,
    msg,
    writed,
  }
}

// NOTE: default parameter 不能处理空字符串的情况
export const DEFAULT_NAME = 'clash-config-manager'

export function getConfigFile(name?: string, clashMeta = false) {
  name ||= DEFAULT_NAME
  const subdir = clashMeta ? 'clash.meta' : 'clash'
  return pathjoin(homedir(), `.config/${subdir}/${name}.yaml`)
}

export function getConfigFileDisplay(name?: string, clashMeta = false) {
  name ||= DEFAULT_NAME
  const subdir = clashMeta ? 'clash.meta' : 'clash'
  return `~/.config/${subdir}/${name}.yaml`
}
