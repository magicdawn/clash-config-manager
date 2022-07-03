import { proxy } from 'valtio'

import { actions as globalActions } from './page/global-model'
import { state as currentConfig } from './page/current-config/model'
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
}

// init on start
process.nextTick(() => {
  rootActions.global.init()
})
