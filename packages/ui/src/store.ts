import { proxy } from 'valtio'
import { devtools } from 'valtio/utils'

import {
  state as currentConfig,
  actions as currentConfigActions,
} from './page/current-config/model'
import { actions as globalActions } from './page/global-model'
import {
  state as libraryRuleList,
  actions as libraryRuleListActions,
} from './page/library-rule-list/model'
import {
  state as librarySubscribe,
  actions as librarySubscribeActions,
} from './page/library-subscribe/model'
import { state as preference } from './page/preference/model'

export const rootState = proxy({
  currentConfig,
  librarySubscribe,
  libraryRuleList,
  preference,
})

export const rootActions = {
  global: globalActions,
  libraryRuleList: libraryRuleListActions,
  librarySubscribe: librarySubscribeActions,
  currentConfig: currentConfigActions,
}

// init on start
process.nextTick(() => {
  rootActions.global.init()
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const unsub = devtools(rootState, {
  name: 'valtio rootState',
  enabled: process.env.NODE_ENV === 'development',
})

// fixme
global.rootActions = rootActions
global.rootState = rootState
