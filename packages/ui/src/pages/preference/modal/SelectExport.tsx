import { useMemoizedFn, useUpdateEffect } from 'ahooks'
import { Modal, Tree, type TreeProps } from 'antd'
import { cloneDeep, pick } from 'es-toolkit'
import { useCallback, useState, type Key } from 'react'
import { proxy, useSnapshot } from 'valtio'
import { storageDataDisplayNames, type ExportData } from '$ui/storage'
import { truthy } from '$ui/utility/ts-filter'
import type { ConfigItem } from '$ui/types'
import type { Merge } from 'type-fest'

type SelectExportProps = {
  visible: boolean
  setVisible: (val: boolean) => void
  treeData?: TreeData[] // can not be null
  resolve?: Resolve | null
}

type SelectResult = {
  cancel: boolean
  keys?: Key[]
}

type Resolve = (result: SelectResult) => void

export default function SelectExport({ visible, setVisible, treeData, resolve }: SelectExportProps) {
  const onCancel = useMemoizedFn(() => {
    setVisible(false)
    resolve?.({ cancel: true })
  })
  const onOk = useMemoizedFn(() => {
    setVisible(false)
    resolve?.({ cancel: false, keys: checkedKeys })
  })

  const [expandedKeys, setExpandedKeys] = useState<Key[]>(() => getAllKeys(treeData))
  const [checkedKeys, setCheckedKeys] = useState<Key[]>([])
  const [selectedKeys, setSelectedKeys] = useState<Key[]>([])
  const [autoExpandParent, setAutoExpandParent] = useState(true)

  useUpdateEffect(() => {
    setExpandedKeys(getAllKeys(treeData))
  }, [treeData])

  const onExpand = (expandedKeys: Key[]) => {
    // if not set autoExpandParent to false, if children expanded, parent can not collapse.
    // or, you can remove all expanded children keys.
    console.log('onExpand', expandedKeys)
    setExpandedKeys(expandedKeys)
    setAutoExpandParent(false)
  }

  const onCheck: TreeProps['onCheck'] = (checkedKeys) => {
    console.log('onCheck', checkedKeys)
    if (Array.isArray(checkedKeys)) {
      setCheckedKeys(checkedKeys)
    }
  }

  const onSelect: TreeProps['onSelect'] = (selectedKeys, info) => {
    console.log('onSelect', info)
    setSelectedKeys(selectedKeys)
  }

  return (
    <Modal
      title='选择要导出的数据'
      open={visible}
      onCancel={onCancel}
      onOk={onOk}
      centered
      styles={{ body: { maxHeight: '60vh', overflow: 'scroll' } }}
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
        title += ` (${(item as any).name})`
      }

      if (keyPrefix === 'current_config_v2.list.') {
        title += ` -> ${(item as any).type === 'subscribe' ? '订阅' : '配置源'} (${(item as any).name})`
      }

      treeData.push({
        key,
        title,
      })
    })

    return treeData
  }

  for (const currentKey of Object.keys(obj)) {
    const key = keyPrefix + currentKey
    const title = storageDataDisplayNames[key] || currentKey
    treeData.push({
      key,
      title,
      children: generateTreeData(obj[currentKey as keyof typeof obj], `${key}.`),
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

function clean<T extends object>(obj: T) {
  if (!obj || typeof obj !== 'object') return
  for (const i of Object.keys(obj) as (keyof T)[]) {
    const val: any = obj[i]

    if (Array.isArray(val)) {
      ;(obj as any)[i] = val.filter(truthy)
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

  return <SelectExport visible={visible} setVisible={setVisible} treeData={treeData} resolve={resolve} />
}

type PickupData = Omit<ExportData, 'subscribe_detail' | 'subscribe_status'>

// Merge is Object.assign for Types
type PickupDataExtended = Merge<
  PickupData,
  {
    current_config_v2: Merge<
      ExportData['current_config_v2'],
      {
        list: (ConfigItem & { name?: string })[]
      }
    >
  }
>

export async function pickDataFrom(dataFrom: any) {
  const treeSource = cloneDeep(dataFrom) as Partial<PickupDataExtended>

  // current_config_v2 添加 name 字段
  if (treeSource?.current_config_v2?.list) {
    treeSource.current_config_v2.list.forEach((item, i) => {
      const { id } = item
      const target =
        treeSource?.subscribe_list?.find((i) => i.id === id) || treeSource?.rule_list?.find((i) => i.id === id)
      item.name = target?.name
    })
    treeSource.current_config_v2.list = treeSource.current_config_v2.list.filter((item) => {
      return !!item.name
    })
  }

  const treeData = generateTreeData(treeSource)

  const { cancel, keys } = await new Promise<SelectResult>((resolve) => {
    Object.assign(proxyProps, { treeData, visible: true, resolve })
  })

  if (cancel || !keys?.length) {
    return { cancel, keys }
  }

  // sleect
  const data = pick(
    dataFrom,
    keys.map((x) => x.toString()),
  )

  // clean
  clean(data)

  return { cancel, keys, data }
}
