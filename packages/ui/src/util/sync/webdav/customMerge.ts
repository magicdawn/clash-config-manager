/**
subscribe_list: [],
 subscribe_detail: {},

 rule_list: [],

 current_config_v2: {
	 list: [],
	 name: 'clash-config-manager',
 },

 preference: {
	 syncConfig: {
		 davServerUrl: '',
		 user: '',
		 pass: '',
	 },
 },
 */

import _ from 'lodash'
import produce from 'immer'

export default function mergeStore(a, b) {
  let ret = { ...a }

  ret = produce(ret, (draft) => {
    // 'subscribe_detail',
    Object.assign(draft.subscribe_detail, b.subscribe_detail)

    // 'current_config_v2.name',
    // 'preference',
    _.merge(draft, _.pick(b, ['current_config_v2.name', 'preference']))

    // subscribe_list
    for (const i of b.subscribe_list || []) {
      if (!i || !i.id) continue
      const { id } = i

      const existingItem = draft.subscribe_list.find((x) => x.id === id)
      if (existingItem) {
        Object.assign(existingItem, i)
      } else {
        draft.subscribe_list.push(i)
      }
    }

    // rule_list
    for (const i of b.rule_list || []) {
      if (!i || !i.id) continue
      const { id } = i

      const existingItem = draft.rule_list.find((x) => x.id === id)
      if (existingItem) {
        _.merge(existingItem, i)
      } else {
        draft.rule_list.push(i)
      }
    }

    // current_config_v2.list
    for (const i of b.current_config_v2.list || []) {
      if (!i || !i.id) continue
      const { id } = i

      const existingItem = draft.current_config_v2.list.find((x) => x.id === id)
      if (existingItem) {
        Object.assign(existingItem, i)
      } else {
        draft.current_config_v2.list.push(i)
      }
    }
  })

  return ret
}

/* eslint camelcase: off */

if (module === require.main) {
  console.log(
    mergeStore(
      {
        subscribe_list: [{ id: 1, url: 'baidu' }],
        subscribe_detail: { 1: [1] },

        rule_list: [
          {
            id: 1,
            port: 10,
            rules: ['hello-world'],
          },
        ],

        current_config_v2: {
          list: [],
          name: 'clash-config-manager',
        },

        preference: {
          syncConfig: {
            davServerUrl: '',
            user: '',
            pass: '',
          },
        },
      },
      {
        subscribe_list: [
          { id: 1, url: 'google' },
          { id: 2, url: 'sogou' },
        ],
        subscribe_detail: { 1: { x: 2, y: 1 } },
        rule_list: [
          {
            id: 1,
            dns: true,
            rules: ['goodbye', 1, 2, 'hello-world'],
          },
        ],
        current_config_v2: {
          list: [],
          name: 'clash-config-manager2',
        },
        preference: {
          syncConfig: {
            davServerUrl: '3',
            user: '1',
            pass: '2',
          },
        },
      }
    )
  )
}
