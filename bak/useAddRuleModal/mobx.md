deps

```
"mobx": "^6.3.2",
"mobx-react": "^7.5.1",
```

code

```tsx
import { Observer, useLocalObservable } from 'mobx-react'
export function useMobxAddRuleModal(options: { handleAdd: HandleAdd; mode: Mode }) {
  const store = useLocalObservable(() => {
    return {
      modalVisible: false,
      addRule() {
        this.modalVisible = true
      },
      setVisible(val: boolean) {
        this.modalVisible = val
      },
      open() {
        this.setVisible(true)
      },
      close() {
        this.setVisible(false)
      },
    }
  })

  const handleAdd = (rule: string, ruleId: string) => {
    options.handleAdd(rule, ruleId)
  }

  const modal = (
    <Observer>
      {() => {
        const { modalVisible, setVisible } = store
        return (
          <AddRuleModal
            visible={modalVisible}
            setVisible={setVisible}
            onOk={handleAdd}
            mode={options.mode}
          />
        )
      }}
    </Observer>
  )

  return {
    open: store.open,
    close: store.close,
    modal,
  }
}
```
