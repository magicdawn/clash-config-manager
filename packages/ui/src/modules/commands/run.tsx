import { setTimeout as delay } from 'node:timers/promises'
import { notification } from 'antd'
import { shell } from 'electron'
import { createRef } from 'react'
import { message, rootActions } from '$ui/store'
import { generateConfigThenWrite } from '$ui/utility/generate'
import GlobalLoading from '../global-loading'

export const commandPaletteRef = createRef<any>()
export const close = () =>
  new Promise<void>((r) => {
    setTimeout(function () {
      commandPaletteRef.current?.handleCloseModal?.()
      r()
    }, 0)
  })

const commandGen = async ({ forceUpdate = false }: { forceUpdate?: boolean } = {}) => {
  let delayShowTimer: ReturnType<typeof setTimeout> | undefined
  GlobalLoading.show()

  // init first
  rootActions.global.init()

  // let loading show
  await delay(100)

  let result: Awaited<ReturnType<typeof generateConfigThenWrite>> | undefined
  let err: any
  try {
    result = await generateConfigThenWrite({ forceUpdate })
  } catch (e) {
    err = e
  } finally {
    clearTimeout(delayShowTimer)
    GlobalLoading.hide()
  }
  if (err) return console.error(err.stack || err)

  const { success, msg, writed } = result || {}
  if (!success) {
    notification.error({ placement: 'bottomRight', message: '生成失败', description: msg })
    return
  }

  message.success(msg)
  if (writed) {
    // reload config
    shell.openExternal('clash://update-config')
  }
}

export const commands = [
  {
    key: 'generate',
    color: 'green',
    category: '配置管理',
    name: '生成配置 (generate)',
    async command() {
      await close()
      return commandGen({ forceUpdate: false })
    },
  },
  {
    key: 'generate-force-update',
    color: 'green',
    category: '配置管理',
    name: '生成配置-强制更新 (generate forceUpdate)',
    async command() {
      await close()
      return commandGen({ forceUpdate: true })
    },
  },
]

export const runGenerate = () => commandGen({ forceUpdate: false })
export const runGenerateForceUpdate = () => commandGen({ forceUpdate: true })
