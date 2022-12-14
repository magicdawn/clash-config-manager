import { type StorageData } from '$ui/storage'
import _, { cloneDeep, omit } from 'lodash'
import { keysToOmit } from './config'

export function customMerge(baseData: StorageData, importData: Partial<StorageData>) {
  // create a snapshot
  baseData = cloneDeep(baseData)
  // discard useless data
  importData = omit(importData, keysToOmit)

  // 'current_config_v2.name',
  // 'preference',
  _.merge(baseData, _.pick(importData, ['current_config_v2.name', 'preference']))

  // subscribe_list & rule_list
  // if id match, assign & overwrite
  // else push
  const keys = ['subscribe_list', 'rule_list'] as const
  for (const key of keys) {
    if (!importData[key]?.length) continue

    for (const item of importData[key]!) {
      const { id } = item
      if (!id) continue
      // @ts-ignore
      const existingItem = baseData[key].find((x) => x.id === id)
      if (existingItem) {
        Object.assign(existingItem, item)
      } else {
        // @ts-ignore
        baseData[key].push(item)
      }
    }
  }

  // current_config_v2.list
  for (const item of importData.current_config_v2?.list || []) {
    if (!item?.id) continue
    const existingItem = baseData.current_config_v2.list.find((x) => x.id === item.id)
    if (existingItem) {
      Object.assign(existingItem, item)
    } else {
      baseData.current_config_v2.list.push(item)
    }
  }

  return baseData
}

/* eslint camelcase: off */
if (module === require.main) {
  // console.log(
  //   customMerge(
  //     {
  //       subscribe_list: [{ id: '1', name: 'baidu', url: 'baidu' }],
  //       subscribe_detail: {},
  //       subscribe_status: {},
  //       rule_list: [
  //         {
  //           id: '1',
  //           type: 'local',
  //           name: 'hello',
  //           content: 'blabla',
  //         },
  //       ],
  //       current_config_v2: {
  //         list: [],
  //         name: 'clash-config-manager',
  //         forceUpdate: true,
  //       },
  //       preference: {
  //         syncConfig: {
  //           davServerUrl: '',
  //           user: '',
  //           pass: '',
  //         },
  //         vscodeTheme: '',
  //       },
  //     },
  //     {
  //       subscribe_list: [
  //         { id: '1', url: 'google', name: 'google' },
  //         { id: '2', url: 'sogou', name: 'sogou' },
  //       ],
  //       rule_list: [
  //         {
  //           id: '1',
  //           name: '1',
  //           type: 'local',
  //           content: '1',
  //         },
  //       ],
  //       current_config_v2: {
  //         list: [],
  //         name: 'clash-config-manager2',
  //         forceUpdate: true,
  //       },
  //       preference: {
  //         syncConfig: {
  //           davServerUrl: '3',
  //           user: '1',
  //           pass: '2',
  //         },
  //         vscodeTheme: '',
  //       },
  //     }
  //   )
  // )
}
