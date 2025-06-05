import { useMemoizedFn } from 'ahooks'
import { Switch, Tooltip } from 'antd'
import clsx from 'clsx'
import debugFactory from 'debug'
import { useEffect, useMemo, useState } from 'react'
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd'
import { useSnapshot } from 'valtio'
import { limitLines } from '$ui/utility/text-util'
import type { ConfigItem } from '$ui/types'
import { state as libraryRuleListState } from '../partial-config-list/model'
import { state as librarySubscribeState } from '../subscribe-list/store'
import styles from './ConfigDND.module.less'
import { state } from './model'

const dndDebug = debugFactory('app:page:current-config:ConfigDND')

export function ConfigDND() {
  // subscribe
  const subscribeList = useSnapshot(librarySubscribeState.list)
  const subscribeSourceList = useMemo(() => {
    return subscribeList.map((item) => {
      return {
        ...item,
        text: item.name,
        tooltip: item.url,
        tooltipIsYaml: false,
      }
    })
  }, [subscribeList])

  // rule
  const ruleList = useSnapshot(libraryRuleListState.list)
  const ruleSourceList = useMemo(() => {
    return ruleList.map((item) => {
      return {
        id: item.id,
        text: item.name,
        tooltip: item.type === 'local' ? limitLines(item.content, 100) : item.url,
        tooltipIsYaml: item.type === 'local',
        type: item.type, // rule-type
      }
    })
  }, [ruleList])

  // 只放 {type, id}
  const { list: resultList } = useSnapshot(state)

  // 具体 item
  const resultItemList = useMemo(() => {
    return resultList
      .map(({ type, id }) => {
        if (type === 'subscribe') {
          return subscribeSourceList.find((x) => x.id === id)
        }
        if (type === 'rule') {
          return ruleSourceList.find((x) => x.id === id)
        }
      })
      .filter(Boolean)
  }, [resultList, ruleSourceList])

  // 从 list 删除已经不存在的 id
  useEffect(() => {
    if (resultList.length === resultItemList.length) return
    state.list = state.list.filter((item) => {
      return resultItemList.find((x) => x.id === item.id)
    })
  }, [resultList, resultItemList])

  // id set
  const resultIdSet = useMemo(() => {
    return new Set(resultList.map((x) => x.id))
  }, [resultList])

  const [disableDropOnTrash, setDisableDropOnTrash] = useState(true)

  const onDragStart = useMemoizedFn((start) => {
    const droppableId = start.source.droppableId
    if (droppableId === 'result-list') {
      setDisableDropOnTrash(false)
    }
  })

  const onDragEnd = useMemoizedFn((result, provided) => {
    setDisableDropOnTrash(true)

    // console.log(result)
    // {reason, draggableId, type}
    const { source, destination } = result
    if (!destination || !destination.droppableId) return

    // left -> trash
    if (source.droppableId === 'result-list' && destination.droppableId === 'trash') {
      const delIndex = source.index
      state.list.splice(delIndex, 1) // remove
      return
    }

    let addItem: ConfigItem | undefined
    const modifyActions: Array<(list: ConfigItem[]) => void> = []

    // right -> left
    if (source.droppableId === 'rule-source-list') {
      const id = ruleSourceList[source.index].id
      addItem = { type: 'rule', id }
    }
    if (source.droppableId === 'subscribe-source-list') {
      const id = subscribeSourceList[source.index].id
      addItem = { type: 'subscribe', id }
    }

    // left 自己排序
    if (source.droppableId === 'result-list') {
      addItem = resultList[source.index]
      modifyActions.push((l) => l.splice(source.index, 1)) // remove source
    }

    if (!addItem) {
      console.log('no item, result =', result)
      return
    }

    const newindex = destination.index
    for (const action of modifyActions) {
      action(state.list)
    }
    state.list.splice(newindex, 0, addItem!)
  })

  return (
    <div className={styles.dndPlayground}>
      <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
        <div className='col-left'>
          <div className='section-title'>
            当前配置
            <Tooltip
              placement='right'
              title={
                <ul style={{ marginLeft: '-20px' }}>
                  <li>从右侧拖拽订阅源 和 配置源到此处使用订阅或配置</li>
                  <li>拖拽到使用中的配置到垃圾桶删除</li>
                </ul>
              }
            >
              <IconAntDesignQuestionCircleFilled style={{ marginLeft: 5, fontSize: '80%' }} />
            </Tooltip>
          </div>
          <Droppable droppableId={'result-list'} direction='vertical'>
            {(provided, snapshot) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className='result-list'>
                <div className='using-config-wrapper'>
                  {resultItemList.map((item, index) => {
                    return <Source type='result' key={item.id} item={item} index={index}></Source>
                  })}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        </div>

        <div className='col-right'>
          <Droppable droppableId={'trash'} direction='horizontal' isDropDisabled={disableDropOnTrash}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={clsx('trash-wrapper', { 'dragging-over': snapshot.isDraggingOver })}
              >
                <div className='text-wrapper'>
                  <div className='text'>垃圾桶</div>
                </div>
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <div className='section-title'>可用订阅</div>
          <Droppable droppableId={'subscribe-source-list'} direction='horizontal' isDropDisabled={true}>
            {(provided, snapshot) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className='source-list'>
                <div className='source-wrapper'>
                  {provided.placeholder}
                  {subscribeSourceList.map((item, index) => {
                    return (
                      <Source
                        type='source'
                        key={item.id}
                        item={item}
                        index={index}
                        isDragDisabled={resultIdSet.has(item.id)}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </Droppable>

          <div className='section-title'>可用配置</div>
          <Droppable droppableId={'rule-source-list'} direction='horizontal' isDropDisabled={true}>
            {(provided, snapshot) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className='source-list'>
                <div className='source-wrapper'>
                  {provided.placeholder}
                  {ruleSourceList.map((item, index) => {
                    return (
                      <Source
                        type='source'
                        key={item.id}
                        item={item}
                        index={index}
                        isDragDisabled={resultIdSet.has(item.id)}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>
    </div>
  )
}

interface SourceProps {
  item: any // TODO: rm any
  type: 'source' | 'result'
  isDragDisabled?: boolean
  index: number
}

const Source = ({ item, type, isDragDisabled, index }: SourceProps) => {
  const { text, id } = item

  // toggle
  const { list } = useSnapshot(state)
  const itemInConfigList = useMemo(() => {
    return list.find((x) => x.id === id)
  }, [list])
  const toggleEnabled = !itemInConfigList?.disabled

  return (
    <Draggable draggableId={`${type}-${id}`} index={index} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => (
        <div
          className={clsx('item', { disabled: isDragDisabled }, { 'toggle-off': !toggleEnabled })}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {type === 'result' && (
            <Switch
              className={'toggle'}
              size='small'
              defaultChecked
              checked={toggleEnabled}
              onChange={(v) => {
                const itemInConfigList = state.list.find((x) => x.id === id)
                if (!itemInConfigList) return
                itemInConfigList.disabled = !v
              }}
            />
          )}
          <div className='text' style={{ textAlign: 'center' }}>
            {text}
            <Tooltip
              classNames={{ root: styles.tooltipDetailOverlay }}
              placement={type === 'result' ? 'right' : 'left'}
              title={
                <div className={clsx(styles.tooltipDetail, { [styles.yaml]: item.tooltipIsYaml })}>{item.tooltip}</div>
              }
            >
              <IconAntDesignInfoCircleOutlined className='help-icon' />
            </Tooltip>
          </div>
        </div>
      )}
    </Draggable>
  )
}
