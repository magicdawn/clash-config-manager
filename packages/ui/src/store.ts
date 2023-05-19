import { App, message as messageStatic, notification as notificationStatic } from 'antd'
import type { ConfigOptions, MessageInstance } from 'antd/es/message/interface'
import type { ModalStaticFunctions } from 'antd/es/modal/confirm'
import type { NotificationInstance } from 'antd/es/notification/interface'
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

/**
 * https://ant.design/components/app-cn
 */
let message: MessageInstance = messageStatic
let notification: NotificationInstance = notificationStatic
let modal: Omit<ModalStaticFunctions, 'warn'>

export const messageConfig: ConfigOptions = {
  top: 50,
  duration: 1,
}
messageStatic.config(messageConfig)

export function SetupAntdStatic() {
  const staticFunction = App.useApp()
  message = staticFunction.message
  notification = staticFunction.notification
  modal = staticFunction.modal
  return null
}

export { message, notification, modal }

// fixme
global.rootActions = rootActions
global.rootState = rootState
