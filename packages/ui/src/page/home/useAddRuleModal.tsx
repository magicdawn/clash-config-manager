import { runCommand } from '$ui/commands/run'
import { rootActions, rootState } from '$ui/store'
import { message } from 'antd'
import { ipcRenderer } from 'electron'
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
export { store as addRuleStore }

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

// 从 tray 添加规则
ipcRenderer.on('add-rule', () => {
  rootActions.global.navigate('/')
  store.open()
})

export function useAddRuleModalFromGlobal() {
  return useAddRuleModal({
    mode: 'from-global',
    handleAdd(rule: string, ruleId: string) {
      if (!rule || !ruleId) {
        return message.warn(`内容 or 待添加规则为空`)
      }

      const index = rootState.libraryRuleList.list.findIndex((item) => item.id === ruleId)
      const ruleItem = rootState.libraryRuleList.list[index]
      if (!ruleItem) {
        return message.warn(`找不到待添加规则`)
      }

      if (ruleItem.type !== 'local') {
        return
      }

      const content = ruleItem.content || ''
      if (content.split('\n').find((x: string) => x.includes(rule) && !x.trim().startsWith('#'))) {
        return message.error(`rule ${rule} 已存在`)
      }

      // construct new content
      const newContent = content.trimEnd() + '\n' + `  - ${rule}` + '\n'
      // save new content
      rootActions.libraryRuleList.edit({
        editItemIndex: index,
        item: { ...ruleItem, content: newContent },
      })
      message.success(`已添加规则 ${rule} 至 ${ruleItem.name}`)

      // 生成
      runCommand('generate')
    },
  })
}
