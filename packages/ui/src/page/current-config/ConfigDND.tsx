import { ConfigItem } from '$ui/common/define'
import { rootState } from '$ui/store'
import { limitLines } from '$ui/util/text-util'
import { truthy } from '$ui/util/ts-filter'
import { InfoCircleOutlined } from '@ant-design/icons'
import { useMemoizedFn } from 'ahooks'
import { Tooltip } from 'antd'
import cx from 'classnames'
import React, { useMemo, useState } from 'react'
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd'
import { useSnapshot } from 'valtio'
import styles from './ConfigDND.module.less'

function modifyResultList(action: (list: ConfigItem[]) => void) {
  action(rootState.currentConfig.list)
}

export function ConfigDND() {
  // subscribe
  const rootStateSnap = useSnapshot(rootState)
  const subscribeList = rootStateSnap.librarySubscribe.list

  const subscribeSourceList = useMemo(() => {
    return subscribeList.map((item) => {
      return {
        ...item,
        text: item.name,
        tooltip: item.url,
      }
    })
  }, [subscribeList])

  // rule
  const ruleList = rootStateSnap.libraryRuleList.list
  const ruleSourceList = useMemo(() => {
    return ruleList.map((item) => {
      return {
        id: item.id,
        text: item.name,
        tooltip: item.type === 'local' ? limitLines(item.content, 100) : item.url,
        type: item.type, // rule-type
      }
    })
  }, [ruleList])

  // 只放 {type, id}
  const resultList = rootStateSnap.currentConfig.list

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
      .filter(truthy)
  }, [resultList, ruleSourceList])

  // id set
  const resultIdSet = useMemo(() => {
    return new Set(resultList.map((x) => x.id))
  }, [resultList])

  const [trashDropDisabled, setTrashDropDisabled] = useState(true)

  const onDragStart = useMemoizedFn((start) => {
    const droppableId = start.source.droppableId
    if (droppableId === 'result-list') {
      setTrashDropDisabled(false)
    }
  })

  const onDragEnd = useMemoizedFn((result, provided) => {
    setTrashDropDisabled(true)

    // console.log(result)
    // {reason, draggableId, type}
    const { source, destination } = result
    if (!destination || !destination.droppableId) return

    // from result-list to trash
    if (source.droppableId === 'result-list' && destination.droppableId === 'trash') {
      const delIndex = source.index
      modifyResultList((list) => {
        list.splice(delIndex, 1) // remove
      })
      return
    }

    let addItem
    const modifyActions: Array<(list: ConfigItem[]) => void> = []
    if (source.droppableId === 'rule-source-list') {
      const id = ruleSourceList[source.index].id
      addItem = { type: 'rule', id }
    }
    if (source.droppableId === 'subscribe-source-list') {
      const id = subscribeSourceList[source.index].id
      addItem = { type: 'subscribe', id }
    }

    if (source.droppableId === 'result-list') {
      addItem = resultList[source.index]
      modifyActions.push((l) => l.splice(source.index, 1)) // remove source
    }

    if (!addItem) {
      console.log('no item, result = ', result)
    }

    const newindex = destination.index
    modifyResultList((list) => {
      for (const action of modifyActions) {
        action(list)
      }
      list.splice(newindex, 0, addItem)
    })
  })

  return (
    <div className={styles.dndPlayground}>
      <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
        <div className='col-left'>
          <h1>当前配置</h1>
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
          <Droppable
            droppableId={'trash'}
            direction='horizontal'
            isDropDisabled={trashDropDisabled}
          >
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cx('trash-wrapper', { 'dragging-over': snapshot.isDraggingOver })}
              >
                <div className='text'>
                  <div>垃</div>
                  <div>圾</div>
                  <div>桶</div>
                </div>
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <h1>可用订阅</h1>
          <Droppable
            droppableId={'subscribe-source-list'}
            direction='horizontal'
            isDropDisabled={true}
          >
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
                      ></Source>
                    )
                  })}
                </div>
              </div>
            )}
          </Droppable>

          <h1>可用配置</h1>
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
  item
  type
  isDragDisabled?: boolean
  index
}

const Source = ({ item, type, isDragDisabled, index }: SourceProps) => {
  const { text, id } = item
  return (
    <Draggable draggableId={`${type}-${id}`} index={index} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => (
        <div
          className={cx('item', { disabled: isDragDisabled })}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div className='text'>
            {text}
            <Tooltip
              overlayClassName={styles.tooltipDetailOverlay}
              title={<div className={styles.tooltipDetail}>{item.tooltip}</div>}
            >
              <InfoCircleOutlined className='help-icon' />
            </Tooltip>
          </div>
        </div>
      )}
    </Draggable>
  )
}
