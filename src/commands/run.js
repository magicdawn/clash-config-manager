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
  } finally {
    Loading.hide()
  }

  const {success, msg} = result || {}
  if (success) {
    message.success(msg || '生成成功')
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
      return commandGen()
    },
  },
  {
    key: 'generate-force-update',
    category: '配置管理',
    name: '生成配置-强制更新 (generate forceUpdate)',
    async command() {
      await close()
      return commandGen()
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
