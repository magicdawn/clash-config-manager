import { ipcRenderer } from 'electron'
import { proxy, useSnapshot } from 'valtio'
import { runGenerate } from '$ui/modules/commands/run'
import { message, rootActions, rootState } from '$ui/store'
import AddRuleModal, { type Mode } from '../partial-config-list/AddRuleModal'

type HandleAdd = (rule: string, ruleId: string) => void

const state = proxy({ modalVisible: false })

const _setVisible = (val: boolean) => {
  state.modalVisible = val
  ipcRenderer.invoke('set-top-most', val)
  if (val) {
    document.title += ` - 已置顶`
  } else {
    document.title = document.title.split(' - ')[0]
  }
}

export const addRuleModalActions = {
  setVisible: _setVisible,
  addRule: () => {
    state.modalVisible = true
  },
  open() {
    _setVisible(true)
  },
  close() {
    _setVisible(false)
  },
}

export function useAddRuleModal({ handleAdd, mode }: { handleAdd: HandleAdd; mode: Mode }) {
  const { modalVisible } = useSnapshot(state)
  const modal = (
    <AddRuleModal visible={modalVisible} setVisible={addRuleModalActions.setVisible} onOk={handleAdd} mode={mode} />
  )
  return { open, close, modal }
}

// 从 tray 添加规则
ipcRenderer.on('add-rule', () => {
  rootActions.global.navigate('/')
  addRuleModalActions.open()
})

export function useAddRuleModalFromGlobal() {
  return useAddRuleModal({
    mode: 'from-global',
    handleAdd(rule: string, ruleId: string) {
      if (!rule || !ruleId) {
        return message.warning(`内容 or 待添加规则为空`)
      }

      const index = rootState.libraryRuleList.list.findIndex((item) => item.id === ruleId)
      const ruleItem = rootState.libraryRuleList.list[index]
      if (!ruleItem) {
        return message.warning(`找不到待添加规则`)
      }

      if (ruleItem.type !== 'local') {
        return
      }

      const content = ruleItem.content || ''
      const contentLines = content.split('\n')
      function checkInclude(s: string) {
        return !!contentLines.find((x) => !x.trim().startsWith('#') && x.includes(s))
      }

      const check = rule.split(',').slice(0, 2).join(',')
      const exists = checkInclude(check)

      // construct new content
      let newContent: string
      let msg: string
      if (exists) {
        // add same as existing
        if (checkInclude(rule)) {
          return message.error(`rule ${rule} 已存在`)
        }

        // target 不同
        const idx = contentLines.findIndex((x) => !x.trim().startsWith('#') && x.includes(check))
        newContent = contentLines.with(idx, `  - ${rule}`).join('\n')
        msg = `已替换规则 ${rule} 至 ${ruleItem.name}`
      } else {
        newContent = `${content.trimEnd()}\n` + `  - ${rule}` + `\n`
        msg = `已添加规则 ${rule} 至 ${ruleItem.name}`
      }

      // save new content
      rootActions.libraryRuleList.edit({
        editItemIndex: index,
        item: { ...ruleItem, content: newContent },
      })
      message.success(msg)

      // 生成
      runGenerate()
    },
  })
}
