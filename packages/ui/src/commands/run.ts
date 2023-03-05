import Loading from '$ui/page/common/global/loading'
import { rootActions } from '$ui/store'
import gen from '$ui/util/gen'
import { message } from 'antd'
import { createRef } from 'react'
import { setTimeout as delay } from 'timers/promises'

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
  Loading.show()

  // init first
  rootActions.global.init()

  // let loading show
  await delay(100)

  let result: Awaited<ReturnType<typeof gen>>
  try {
    result = await gen({ forceUpdate })
  } catch (e) {
    message.error('生成失败: ', e.message)
    throw e
  } finally {
    clearTimeout(delayShowTimer)
    Loading.hide()
  }

  const { success, msg, filename } = result || {}
  if (success) {
    message.success(msg)
  } else {
    message.error(msg || '生成失败')
  }
}

export const commands = [
  {
    key: 'generate',
    category: '配置管理',
    name: '生成配置 (generate)',
    async command() {
      await close()
      return commandGen({ forceUpdate: false })
    },
  },
  {
    key: 'generate-force-update',
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
