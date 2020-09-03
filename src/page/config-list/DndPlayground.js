import {DragDropContext, Droppable, Draggable} from 'react-beautiful-dnd'
import React, {useMemo} from 'react'
import {usePersistFn} from 'ahooks'
import {useModifyState} from '@x/react/hooks'
import './DndPlayground.less'

export default function DndPlaygroud(props) {
  const list = new Array(10).fill(0).map((_, index) => {
    return {
      id: index + 1,
      text: `${index + 1}😂`,
    }
  })

  const [resultList, modifyResultList] = useModifyState([])
  const resultListIdSet = useMemo(() => {
    return new Set(resultList.map((i) => i.id))
  }, [resultList])

  const onDragEnd = usePersistFn((result, provided) => {
    console.log(result)
    const {draggableId, type, source, destination, reason} = result
    if (!destination || !destination.droppableId) return

    let item
    const modifyActions = []
    if (source.droppableId === 'source-list') {
      item = list[source.index]
    }
    if (source.droppableId === 'result-list') {
      debugger
      item = resultList[source.index]
      modifyActions.push((l) => l.splice(source.index, 1)) // remove source
    }

    if (!item) {
      console.log('no item')
      console.log(result)
    }

    const newindex = destination.index
    modifyResultList((list) => {
      for (let action of modifyActions) {
        action(list)
      }
      list.splice(newindex, 0, {...item})
    })
  })

  return (
    <div className='dnd-playdround'>
      <DragDropContext onDragEnd={onDragEnd}>
        <div>
          <Droppable droppableId={'source-list'} direction='horizontal' isDropDisabled={true}>
            {(provided, snapshot) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                <h1>All available sources</h1>

                <div className='source-wrapper'>
                  {provided.placeholder}
                  {list.map((item, index) => {
                    return (
                      <Source
                        type='source'
                        key={item.id}
                        item={item}
                        index={index}
                        isDragDisabled={resultListIdSet.has(item.id)}
                      ></Source>
                    )
                  })}
                </div>
              </div>
            )}
          </Droppable>

          <Droppable droppableId={'result-list'} direction='horizontal'>
            {(provided, snapshot) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                <h1>using config</h1>

                <div className='using-config-wrapper'>
                  {resultList.map((item, index) => {
                    return <Source type='result' key={item.id} item={item} index={index}></Source>
                  })}
                  {provided.placeholder}
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
          className='item'
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <p>{text}</p>
        </div>
      )}
    </Draggable>
  )
}
