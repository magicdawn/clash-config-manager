import { App, message as messageStatic, notification as notificationStatic } from 'antd'
import type { ConfigOptions, MessageInstance } from 'antd/es/message/interface'
import type { ModalStaticFunctions } from 'antd/es/modal/confirm'
import type { NotificationInstance } from 'antd/es/notification/interface'
import { proxy } from 'valtio'
import { devtools } from 'valtio/utils'

import { actions as globalActions } from './modules/global-model'
import {
  state as currentConfig,
  actions as currentConfigActions,
} from './pages/current-config/model'
import {
  state as libraryRuleList,
  actions as libraryRuleListActions,
} from './pages/partial-config-list/model'
import { state as preference } from './pages/preference/model'
import {
  state as librarySubscribe,
  actions as librarySubscribeActions,
} from './pages/subscribe-list/model'

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

export { message, modal, notification }
;(globalThis as any).rootActions = rootActions
;(globalThis as any).rootState = rootState
