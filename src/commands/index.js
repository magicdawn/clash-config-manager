import CommandPalette from 'react-command-palette'
import React, {useRef, createRef} from 'react'

import Loading from '../page/common/global/loading'
// Loading.show()

// theme
import oneLightTheme from './theme/one-light.module.less'

const commandPaletteRef = createRef()
const close = () =>
  new Promise((r) => {
    setTimeout(function () {
      commandPaletteRef.current?.handleCloseModal?.()
      r()
    }, 0)
  })

const commands = [
  {
    category: '配置管理',
    name: '生成配置 (generate)',
    async command() {
      await close()
      Loading.show()
      setTimeout(function () {
        Loading.hide()
      }, 3000)
    },
  },
  {
    category: '配置管理',
    name: '生成配置-强制更新 (generate forceUpdate)',
    async command() {
      await close()
      Loading.show()
      setTimeout(function () {
        Loading.hide()
      }, 3000)
    },
  },
]

export default function Commands() {
  return (
    <CommandPalette
      ref={commandPaletteRef}
      commands={commands}
      trigger={<span></span>}
      resetInputOnClose
      alwaysRenderCommands
      open
      theme={oneLightTheme}
    />
  )
}
