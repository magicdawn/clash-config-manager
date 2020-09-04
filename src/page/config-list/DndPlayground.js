import {DragDropContext, Droppable, Draggable} from 'react-beautiful-dnd'
import React, {useMemo, useState} from 'react'
import {usePersistFn, useMount} from 'ahooks'
import {useModifyState, useShallowEqualSelector} from '@x/react/hooks'
import {useSelector, useDispatch} from 'react-redux'
import {InfoCircleOutlined} from '@ant-design/icons'
import {Tooltip} from 'antd'
import cx from 'classnames'
import styles from './DndPlayground.module.less'

export default function DndPlaygroud(props) {
  const ruleList = useSelector((state) => {
    return state.libraryRuleList.list
  })

  const ruleSourceList = useMemo(() => {
    return ruleList.map((item) => {
      return {
        id: item.id,
        text: item.name,
        content: item.content,
        type: item.type, // rule-type
      }
    })
  }, [ruleList])

  const dispatch = useDispatch()
  useMount(() => {
    dispatch.libraryRuleList.init()
  }, [])

  // 只放 id
  const [resultIdList, modifyResultIdList] = useModifyState([])

  // 具体 item
  const resultItemList = useMemo(() => {
    return resultIdList
      .map((id) => {
        return ruleSourceList.find((x) => x.id === id)
      })
      .filter(Boolean)
  }, [resultIdList, ruleSourceList])

  // id set
  const resultIdSet = useMemo(() => {
    return new Set(resultIdList)
  }, [resultIdList])

  const [trashDropDisabled, setTrashDropDisabled] = useState(true)

  const onDragStart = usePersistFn((start) => {
    const droppableId = start.source.droppableId
    if (droppableId === 'result-list') {
      console.log('setTrashDropDisabled to false')
      setTrashDropDisabled(false)
    }
  })

  const onDragEnd = usePersistFn((result, provided) => {
    setTrashDropDisabled(true)

    // console.log(result)
    const {draggableId, type, source, destination, reason} = result
    if (!destination || !destination.droppableId) return

    // from result-list to trash
    if (source.droppableId === 'result-list' && destination.droppableId === 'trash') {
      const delIndex = source.index
      modifyResultIdList((l) => {
        l.splice(delIndex, 1) // remove
      })
      return
    }

    let id
    const modifyActions = []
    if (source.droppableId === 'source-list') {
      id = ruleSourceList[source.index].id
    }
    if (source.droppableId === 'result-list') {
      id = resultIdList[source.index]
      modifyActions.push((l) => l.splice(source.index, 1)) // remove source
    }

    if (!id) {
      console.log('no item')
      console.log(result)
    }

    const newindex = destination.index
    modifyResultIdList((list) => {
      for (let action of modifyActions) {
        action(list)
      }
      list.splice(newindex, 0, id)
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
          <h1>垃圾桶</h1>
          <Droppable
            droppableId={'trash'}
            direction='horizontal'
            isDropDisabled={trashDropDisabled}
          >
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cx('trash-wrapper', {'dragging-over': snapshot.isDraggingOver})}
              >
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <h1>可用配置</h1>
          <Droppable droppableId={'source-list'} direction='horizontal' isDropDisabled={true}>
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
                      ></Source>
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

const Source = ({item, type, isDragDisabled, index}) => {
  const {text, id} = item
  return (
    <Draggable
      draggableId={`${type}-${id}`}
      index={index}
      type={type}
      isDragDisabled={isDragDisabled}
    >
      {(provided, snapshot) => (
        <div
          className={cx('item', {disabled: isDragDisabled})}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div className='text'>
            {text}
            <Tooltip
              overlayClassName={styles.tooltipDetailOverlay}
              title={<div className={styles.tooltipDetail}>{item.content}</div>}
            >
              <InfoCircleOutlined className='help-icon' />
            </Tooltip>
          </div>
        </div>
      )}
    </Draggable>
  )
}
