import CommandPalette from 'react-command-palette'
import React, {useRef, createRef} from 'react'

// theme
import oneLightTheme from './theme/one-light.module.less'

const commandPaletteRef = createRef()
const close = () => {
  setTimeout(function () {
    commandPaletteRef.current?.handleCloseModal?.()
  }, 0)
}

const commands = [
  {
    category: '配置管理',
    name: '生成配置 (generate)',
    command() {
      close()
    },
  },
  {
    category: '配置管理',
    name: '生成配置-强制更新 (generate forceUpdate)',
    command() {
      close()
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
