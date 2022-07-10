import { StorageData } from '$ui/storage'
import { truthy } from '$ui/util/ts-filter'
import { useMemoizedFn, useUpdateEffect } from 'ahooks'
import { Modal, Tree } from 'antd'
import _ from 'lodash'
import { useCallback, useState } from 'react'
import { proxy, useSnapshot } from 'valtio'
import { Merge } from 'type-fest'
import { ConfigItem } from '$ui/common/define'

type SelectExportProps = {
  visible: boolean
  setVisible: (val: boolean) => void
  treeData?: TreeData[] // can not be null
  resolve?: Resolve | null
}

type SelectResult = {
  cancel: boolean
  keys?: string[]
}

type Resolve = (result: SelectResult) => void

export default function SelectExport({
  visible,
  setVisible,
  treeData,
  resolve,
}: SelectExportProps) {
  const onCancel = useMemoizedFn(() => {
    setVisible(false)
    resolve?.({ cancel: true })
  })
  const onOk = useMemoizedFn(() => {
    setVisible(false)
    resolve?.({ cancel: false, keys: checkedKeys })
  })

  const [expandedKeys, setExpandedKeys] = useState(() => getAllKeys(treeData))
  const [checkedKeys, setCheckedKeys] = useState<string[]>([])
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [autoExpandParent, setAutoExpandParent] = useState(true)

  useUpdateEffect(() => {
    setExpandedKeys(getAllKeys(treeData))
  }, [treeData])

  const onExpand = (expandedKeys: string[]) => {
    // if not set autoExpandParent to false, if children expanded, parent can not collapse.
    // or, you can remove all expanded children keys.
    console.log('onExpand', expandedKeys)
    setExpandedKeys(expandedKeys)
    setAutoExpandParent(false)
  }

  const onCheck = (checkedKeys: string[]) => {
    console.log('onCheck', checkedKeys)
    setCheckedKeys(checkedKeys)
  }

  const onSelect = (selectedKeys: string[], info) => {
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
      bodyStyle={{ maxHeight: '60vh', overflow: 'scroll' }}
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

type TreeData = {
  key: string
  title: string
  children?: TreeData[]
}

function generateTreeData(obj: object, keyPrefix = '') {
  const treeData: TreeData[] = []

  if (!obj) {
    return treeData
  }
  if (typeof obj !== 'object') {
    return treeData
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const key = `${keyPrefix}${index}`
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

  for (const i of Object.keys(obj)) {
    let title = i
    const key = keyPrefix + i

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

function getAllKeys(tree?: TreeData[] | null) {
  if (!tree || !tree.length) return []
  let ret: string[] = []
  tree.forEach((item) => {
    ret.push(item.key)
    ret = ret.concat(getAllKeys(item.children))
  })
  return ret
}

function clean(obj: object) {
  if (!obj || typeof obj !== 'object') return
  for (const i of Object.keys(obj)) {
    const val = obj[i]

    if (Array.isArray(val)) {
      obj[i] = obj[i].filter(truthy)
      continue
    }

    clean(val)
  }
}

const proxyProps = proxy<{
  visible: boolean
  treeData?: TreeData[] | null
  resolve?: Resolve | null
}>({
  visible: true,
  treeData: null,
  resolve: null,
})

export function SelectExportForStaticMethod() {
  const { treeData, visible, resolve } = useSnapshot(proxyProps)

  const setVisible = useCallback((val: boolean) => {
    proxyProps.visible = val
  }, [])

  if (!treeData) {
    return null
  }

  return (
    <SelectExport visible={visible} setVisible={setVisible} treeData={treeData} resolve={resolve} />
  )
}

// Merge is Object.assign for Types
type StorageDataExtended = Merge<
  StorageData,
  {
    current_config_v2: Merge<
      StorageData['current_config_v2'],
      {
        list: (ConfigItem & { name?: string })[]
      }
    >
  }
>

export async function pick(originalObj: StorageData) {
  const obj = _.cloneDeep(originalObj) as StorageDataExtended

  if (obj?.current_config_v2?.list) {
    obj.current_config_v2.list.forEach((item, i) => {
      const { id } = item
      const target =
        obj?.subscribe_list?.find((i) => i.id === id) || obj?.rule_list?.find((i) => i.id === id)
      item.name = target?.name
    })
    obj.current_config_v2.list = obj.current_config_v2.list.filter((item) => {
      return !!item.name
    })
  }

  const treeData = generateTreeData(obj)

  const { cancel, keys } = await new Promise<SelectResult>((resolve) => {
    Object.assign(proxyProps, { treeData, visible: true, resolve })
  })

  if (cancel) {
    return { cancel, keys }
  }

  // sleect
  const data = _.pick(originalObj, keys!)

  // clean
  clean(data)

  return { cancel, keys, data }
}
