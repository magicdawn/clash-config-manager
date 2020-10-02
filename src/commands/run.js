import React, {useRef, createRef} from 'react'
import {message} from 'antd'
import Loading from '../page/common/global/loading'
import gen from '../util/fn/gen'

export const commandPaletteRef = createRef()
export const close = () =>
  new Promise((r) => {
    setTimeout(function () {
      commandPaletteRef.current?.handleCloseModal?.()
      r()
    }, 0)
  })

const commandGen = async ({forceUpdate = false} = {}) => {
  Loading.show()

  let result = {}
  try {
    result = await gen({forceUpdate})
  } catch (e) {
    message.error('生成失败: ', e.message)
    throw e
  } finally {
    Loading.hide()
  }

  const {success, msg, filename} = result || {}
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
      return commandGen({forceUpdate: true})
    },
  },
  {
    key: 'generate-force-update',
    category: '配置管理',
    name: '生成配置-强制更新 (generate forceUpdate)',
    async command() {
      await close()
      return commandGen({forceUpdate: true})
    },
  },
]

export async function runCommand(key) {
  const cmd = commands.find((x) => x.key === key)
  if (!cmd) {
    console.error('runCommand %s: command not found')
    return
  }

  await cmd.command()
}
