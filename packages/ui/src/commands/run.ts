import Loading from '$ui/page/common/global/loading'
import { rootActions } from '$ui/store'
import gen from '$ui/util/fn/gen'
import { message } from 'antd'
import { createRef } from 'react'

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
  if (forceUpdate) {
    Loading.show()
  } else {
    delayShowTimer = setTimeout(() => {
      Loading.show()
    }, 100)
  }

  // init first
  rootActions.global.init()

  let result
  try {
    result = await gen({ forceUpdate }) // {forceUpdate}
  } catch (e) {
    message.error('生成失败: ', e.message)
    throw e
  } finally {
    clearTimeout(delayShowTimer)
    Loading.hide()
  }

  const { success, msg, filename } = result || {}
  if (success) {
    message.success(`生成成功: ${filename} 已更新`)
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

type CMD = 'generate' | 'generate-force-update'

export async function runCommand(key: CMD) {
  const cmd = commands.find((x) => x.key === key)
  if (!cmd) {
    console.error('runCommand %s: command not found')
    return
  }

  await cmd.command()
}
