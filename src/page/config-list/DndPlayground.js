import {DragDropContext, Droppable, Draggable} from 'react-beautiful-dnd'
import React from 'react'
import {usePersistFn} from 'ahooks'

export default function DndPlaygroud(props) {
  const list = new Array(10).fill(0).map((_, index) => {
    return {
      text: `the ${index + 1} one`,
    }
  })

  const onDragEnd = usePersistFn(() => {
    // TODO:
  })

  return (
    <div className='dnd-playdround'>
      <DragDropContext onDragEnd={onDragEnd}>
        <div>
          <h1>All available sources</h1>
          {/* <Draggable></Draggable> */}
        </div>
      </DragDropContext>
    </div>
  )
}
