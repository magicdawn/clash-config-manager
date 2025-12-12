import { Checkbox, Tooltip } from 'antd'
import { ipcRenderer } from 'electron'
import { useSnapshot } from 'valtio'
import { state } from './model'

export function ConfigForUseSystemProxy() {
  const { useSystemProxy } = useSnapshot(state)
  return (
    <Checkbox
      checked={useSystemProxy}
      onChange={(e) => {
        state.useSystemProxy = e.target.checked
        ipcRenderer.invoke('set-use-system-proxy', e.target.checked)
      }}
    >
      <Tooltip title='是否使用系统代理更新外部资源'>使用系统代理</Tooltip>
    </Checkbox>
  )
}
