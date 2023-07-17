import { produce } from 'immer'
import { useCallback, useState } from 'react'

const reducer = produce((draft, payload) => {
  // invalid payload
  if (typeof payload === 'undefined') return

  if (typeof payload === 'object') {
    Object.assign(draft, payload)
    return
  }

  if (typeof payload === 'function') {
    return payload(draft)
  }

  // others just replace with payload
  // number / string / boolean / null ...
  return payload
})

type PayloadFn<T> = (draft: T) => T | void | undefined | null
type Payload<T> = Partial<T> | PayloadFn<T>

export default function useImmerState<T>(
  initialState: T | (() => T)
): [T, (payload: Payload<T>) => void] {
  const [state, setState] = useState(initialState)
  const modifyState = useCallback(
    (payload) => {
      setState((state) => reducer(state, payload))
    },
    [setState]
  )
  return [state, modifyState]
}
