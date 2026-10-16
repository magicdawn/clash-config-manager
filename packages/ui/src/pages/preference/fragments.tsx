import { Checkbox, Tooltip } from 'antd'
import { useSnapshot } from 'valtio'
import { client } from '$ui/modules/rpc-client'
import { state } from './model'

export function ConfigForUseSystemProxy() {
  const { useSystemProxy } = useSnapshot(state)
  return (
    <Checkbox
      checked={useSystemProxy}
      onChange={(e) => {
        state.useSystemProxy = e.target.checked
        client.setUseSystemProxy(e.target.checked)
      }}
    >
      <Tooltip title='是否使用系统代理更新外部资源'>使用系统代理</Tooltip>
    </Checkbox>
  )
}
