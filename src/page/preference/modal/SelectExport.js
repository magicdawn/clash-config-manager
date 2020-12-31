import React, {useCallback, useState, useEffect} from 'react'
import {Modal, Tree} from 'antd'
import {BehaviorSubject} from 'rxjs'
import useImmerState from '@util/hooks/useImmerState'
import {usePersistFn, useUpdateEffect} from 'ahooks'
import _ from 'lodash'

export default function SelectExport(props) {
  const {visible, setVisible, treeData, resolve} = props

  const onCancel = usePersistFn(() => {
    setVisible(false)
    resolve?.({cancel: true})
  })
  const onOk = usePersistFn(() => {
    setVisible(false)
    resolve?.({cancel: false, keys: checkedKeys})
  })

  const [expandedKeys, setExpandedKeys] = useState(() => getAllKeys(treeData))
  const [checkedKeys, setCheckedKeys] = useState([])
  const [selectedKeys, setSelectedKeys] = useState([])
  const [autoExpandParent, setAutoExpandParent] = useState(true)

  useUpdateEffect(() => {
    setExpandedKeys(getAllKeys(treeData))
  }, [treeData])

  const onExpand = (expandedKeys) => {
    console.log('onExpand', expandedKeys) // if not set autoExpandParent to false, if children expanded, parent can not collapse.
    // or, you can remove all expanded children keys.

    setExpandedKeys(expandedKeys)
    setAutoExpandParent(false)
  }

  const onCheck = (checkedKeys) => {
    console.log('onCheck', checkedKeys)
    setCheckedKeys(checkedKeys)
  }

  const onSelect = (selectedKeys, info) => {
    console.log('onSelect', info)
    setSelectedKeys(selectedKeys)
  }

  return (
    <Modal
      title='选择要导出的数据'
      visible={visible}
      onCancel={onCancel}
      onOk={onOk}
      centered
      bodyStyle={{maxHeight: '60vh', overflow: 'scroll'}}
    >
      <Tree
        checkable
        onExpand={onExpand}
        expandedKeys={expandedKeys}
        autoExpandParent={autoExpandParent}
        onCheck={onCheck}
        checkedKeys={checkedKeys}
        onSelect={onSelect}
        selectedKeys={selectedKeys}
        treeData={treeData}
      />
    </Modal>
  )
}

function generateTreeData(obj, keyPrefix = '') {
  const treeData = []

  if (!obj) {
    return treeData
  }
  if (typeof obj !== 'object') {
    return treeData
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      let key = `${keyPrefix}${index}`
      let title = `index=${index}`

      if (keyPrefix === 'subscribe_list.' || keyPrefix === 'rule_list.') {
        title += ` (${item.name})`
      }

      if (keyPrefix === 'current_config_v2.list.') {
        title += ` -> ${item.type === 'subscribe' ? '订阅' : '配置源'} (${item.name})`
      }

      treeData.push({
        key,
        title,
      })
    })

    return treeData
  }

  for (let i of Object.keys(obj)) {
    let title = i
    let key = keyPrefix + i

    if (key === 'subscribe_list') title = '订阅管理 (有泄露风险,谨慎分享)'
    if (key === 'rule_list') title = '配置源管理'
    if (key === 'current_config_v2') title = '配置管理'
    if (key === 'current_config_v2.list') title = '使用中的列表'
    if (key === 'current_config_v2.name') title = '配置文件名称'
    if (key === 'preference.syncConfig') title = '同步数据配置'
    if (key === 'preference.syncConfig.user') title = '用户名'
    if (key === 'preference.syncConfig.pass') title = '密码(有泄露风险,谨慎分享)'

    treeData.push({
      key,
      title,
      children: generateTreeData(obj[i], key + '.'),
    })
  }

  return treeData
}

function getAllKeys(arr) {
  if (!arr || !arr.length) return []
  let ret = []
  arr.forEach((item) => {
    ret.push(item.key)
    ret = ret.concat(getAllKeys(item.children))
  })
  return ret
}

function clean(obj) {
  if (!obj || typeof obj !== 'object') return
  for (let i of Object.keys(obj)) {
    const val = obj[i]

    if (Array.isArray(val)) {
      obj[i] = obj[i].filter(Boolean)
      continue
    }

    clean(val)
  }
}

export const subject = new BehaviorSubject()

export function SelectExportForStaticMethod() {
  const [{treeData, visible, resolve}, setState] = useImmerState({
    treeData: null,
    visible: false,
    resove: null,
  })

  useEffect(() => {
    const subscription = subject.subscribe((val) => setState(val))
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const setVisible = useCallback(() => {
    subject.next({visible: false})
  }, [])

  if (!treeData) {
    return null
  }

  return (
    <SelectExport visible={visible} setVisible={setVisible} treeData={treeData} resolve={resolve} />
  )
}

export async function pick(obj) {
  const originalObj = obj
  obj = _.cloneDeep(obj)
  obj?.current_config_v2?.list?.forEach((item, i) => {
    const {id} = item
    const target =
      obj?.subscribe_list?.find((i) => i.id === id) || obj?.rule_list?.find((i) => i.id === id)
    item.name = target?.name ?? '未找到对应源'
  })
  const treeData = generateTreeData(obj)

  const {cancel, keys} = await new Promise((resolve) => {
    subject.next({treeData, visible: true, resolve})
  })

  if (cancel) {
    return {cancel, keys}
  }

  // sleect
  const data = _.pick(originalObj, keys)

  // clean
  clean(data)

  return {cancel, keys, data}
}
