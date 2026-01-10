/**
 * https://github.com/microsoft/monaco-editor/issues/4855#issuecomment-3184259279
 */

import { app } from 'electron'

const isMac = process.platform === 'darwin'

app.on('browser-window-created', (_, win) => {
  win.webContents.on('before-input-event', (event, input) => {
    const isCmdOrCtrl = isMac ? input.meta === true : input.control === true

    const hasShift = input.shift === true || input.modifiers.includes('shift')

    const hasAlt = input.alt === true || input.modifiers.includes('alt')

    // Prefer code (layout-agnostic)
    const isV = input.code === 'KeyV' || input.key === 'v'

    const shouldPaste = input.type === 'keyDown' && isCmdOrCtrl && !hasShift && !hasAlt && isV

    if (shouldPaste) {
      // Native paste path (works with Monaco)
      win.webContents.paste()
      event.preventDefault()
    }
  })
})
