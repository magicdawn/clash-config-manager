import React, {useState, useEffect, useCallback} from 'react'
import {usePersistFn} from 'ahooks'
import {Modal, Row} from 'antd'

export default function AddRuleModal(props) {
  const {visible, setVisible} = props

  const handleOk = usePersistFn(() => {
    setVisible(false)
  })

  const handleCancel = usePersistFn(() => {
    setVisible(false)
  })

  return (
    <Modal
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      keyboard={false}
      maskClosable={false}
      title='从 Chrome 添加规则'
    >
      <Row>Hello</Row>
    </Modal>
  )
}
