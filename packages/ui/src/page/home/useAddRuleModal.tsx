import React, {useCallback} from 'react'
import {message} from 'antd'
import {runCommand} from '@ui/commands/run'
import useImmerState from '@ui/util/hooks/useImmerState'
import {usePersistFn} from 'ahooks'
import AddRuleModal, {Mode} from '../library-rule-list/AddRuleModal'
import store from '@ui/store'

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

import {Observer, useLocalObservable} from 'mobx-react'
export function useMobxAddRuleModal(options: {handleAdd: HandleAdd; mode: Mode}) {
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
        const {modalVisible, setVisible} = store
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
