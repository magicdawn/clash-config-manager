import { Modal } from 'antd'
import { proxy, useSnapshot } from 'valtio'
import { CodeEditor } from './CodeEditor'
import { CodeThemeSelect } from './CodeThemeSelect'

const state = proxy({
  open: false,
  code: '',
})

export function ModalCodeViewer() {
  const { open, code } = useSnapshot(state)

  if (!open || !code) return null

  return (
    <Modal
      open={open}
      title={<>查看 Yaml</>}
      width='80vw'
      style={{ position: 'relative' }}
      onCancel={() => {
        state.open = false
        setTimeout(() => {
          state.code = ''
        })
      }}
    >
      <div
        style={{ position: 'absolute', left: '50%', top: 0, transform: 'translate(-50%, 10px)' }}
      >
        <span style={{ marginRight: 5 }}>编辑器主题:</span>
        <CodeThemeSelect width={200} />
      </div>
      <CodeEditor readonly open={open} value={code} />
    </Modal>
  )
}

export const showCodeModal = <ModalCodeViewer />

export function showCode(code: string) {
  state.code = code
  state.open = true
}
