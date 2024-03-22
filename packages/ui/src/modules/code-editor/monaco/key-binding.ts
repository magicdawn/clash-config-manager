import { monaco } from './setup'

/**
 * https://github.com/microsoft/monaco-editor/issues/102
 */

const { KeyCode, KeyMod } = monaco

monaco.editor.addKeybindingRules([
  // ctrl + cmd + up/down
  {
    keybinding: KeyMod.CtrlCmd | KeyMod.WinCtrl | KeyCode.UpArrow,
    command: 'editor.action.moveLinesUpAction',
  },
  {
    keybinding: KeyMod.CtrlCmd | KeyMod.WinCtrl | KeyCode.DownArrow,
    command: 'editor.action.moveLinesDownAction',
  },

  // font size
  {
    keybinding: KeyMod.CtrlCmd | KeyCode.Minus,
    command: 'editor.action.fontZoomOut',
  },
  {
    keybinding: KeyMod.CtrlCmd | KeyCode.Equal,
    command: 'editor.action.fontZoomIn',
  },
  {
    keybinding: KeyMod.CtrlCmd | KeyCode.Digit0,
    command: 'editor.action.fontZoomReset',
  },

  // cmd+shift+D duplicate line
  {
    keybinding: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyD,
    command: 'editor.action.duplicateSelection',
  },
])
