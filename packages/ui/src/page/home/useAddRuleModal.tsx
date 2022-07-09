import { proxy, useSnapshot } from 'valtio'
import AddRuleModal, { Mode } from '../library-rule-list/AddRuleModal'

type HandleAdd = (rule: string, ruleId: string) => void

const store = proxy({
  modalVisible: false,
  addRule: () => {
    store.modalVisible = true
  },
  setVisible: (val: boolean) => {
    store.modalVisible = val
  },
  open: () => {
    store.setVisible(true)
  },
  close: () => {
    store.setVisible(false)
  },
})

export function useAddRuleModal(options: { handleAdd: HandleAdd; mode: Mode }) {
  const handleAdd = (rule: string, ruleId: string) => {
    options.handleAdd(rule, ruleId)
  }

  const { open, close, setVisible } = store
  const { modalVisible } = useSnapshot(store)

  const modal = (
    <AddRuleModal
      visible={modalVisible}
      setVisible={setVisible}
      onOk={handleAdd}
      mode={options.mode}
    />
  )

  return {
    open,
    close,
    modal,
  }
}
