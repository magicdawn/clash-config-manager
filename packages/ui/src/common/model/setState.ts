import { Action, action, State } from 'easy-peasy'

type PlainObject = Record<string, unknown>

export type SetStatePayload<T> = Partial<T> | ((state: T) => T | undefined | void)

export type SetState<IModel extends PlainObject> = Action<IModel, SetStatePayload<State<IModel>>>

export const setStateFactory = <IModel extends PlainObject>() => {
  return action<IModel, SetStatePayload<State<IModel>>>((state, payload) => {
    if (typeof payload === 'object') {
      Object.assign(state, payload)
      return
    }

    if (typeof payload === 'function') {
      const ret = payload(state)
      return ret
    }
  })
}
