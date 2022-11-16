import { Modal } from 'antd'
import { proxy, useSnapshot } from 'valtio'
import { CodeEditor } from './CodeEditor'

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
      title='查看 Yaml'
      width='80vw'
      onCancel={() => {
        state.open = false
        setTimeout(() => {
          state.code = ''
        })
      }}
    >
      <CodeEditor readonly open={open} value={code} />
    </Modal>
  )
}

export const showCodeModal = <ModalCodeViewer />

export function showCode(code: string) {
  state.code = code
  state.open = true
}
