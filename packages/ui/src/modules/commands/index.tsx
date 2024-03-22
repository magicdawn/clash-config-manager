import CommandPalette from 'react-command-palette'
import { commandPaletteRef, commands } from './run'
// theme
import oneLightTheme from './theme/one-light.module.less'

export default function Commands() {
  return (
    <CommandPalette
      ref={commandPaletteRef}
      commands={commands}
      trigger={<span></span>}
      resetInputOnClose
      alwaysRenderCommands
      theme={oneLightTheme}
      options={{ keys: ['name', 'key'] }}
      placeholder='Type to start'
    />
  )
}
