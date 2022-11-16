// https://github.com/microsoft/monaco-editor/issues/102
import * as monaco from 'monaco-editor'

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
])
