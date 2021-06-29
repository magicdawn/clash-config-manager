import React, {useCallback} from 'react'
import {message} from 'antd'
import {runCommand} from '@commands/run'
import useImmerState from '@util/hooks/useImmerState'
import {usePersistFn} from 'ahooks'
import AddRuleModal, {Mode} from '../library-rule-list/AddRuleModal'
import store from '@store'

type HandleAdd = (rule: string, ruleId: string) => void

export default function useAddRuleModal(options: {handleAdd: HandleAdd; mode: Mode}) {
  const [{modalVisible}, setState] = useImmerState({modalVisible: false})

  const addRule = useCallback(() => {
    setState({modalVisible: true})
  }, [])

  const handleAdd = usePersistFn((rule: string, ruleId: string) => {
    options.handleAdd(rule, ruleId)
  })

  const setVisible = useCallback((val) => {
    setState({modalVisible: val})
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
    setState({modalVisible: true})
  }, [])
  const close = useCallback(() => {
    setState({modalVisible: false})
  }, [])

  return {
    open,
    close,
    modal,
  }
}
