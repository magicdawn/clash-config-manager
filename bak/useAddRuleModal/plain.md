plain (but immer)

```tsx
export function useAddRuleModal(options: { handleAdd: HandleAdd; mode: Mode }) {
  const [{ modalVisible }, setState] = useImmerState({ modalVisible: false })

  const handleAdd = useMemoizedFn((rule: string, ruleId: string) => {
    options.handleAdd(rule, ruleId)
  })

  const setVisible = useCallback((val) => {
    setState({ modalVisible: val })
  }, [])

  const modal = (
    <AddRuleModal
      visible={modalVisible}
      setVisible={setVisible}
      onOk={handleAdd}
      mode={options.mode}
    />
  )

  const open = useCallback(() => {
    setState({ modalVisible: true })
  }, [])
  const close = useCallback(() => {
    setState({ modalVisible: false })
  }, [])

  return {
    open,
    close,
    modal,
  }
}
```
