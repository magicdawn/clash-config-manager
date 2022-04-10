import { Action, action, State } from 'easy-peasy'

export type SetStatePayload<T> = Partial<T> | ((state: T) => T | undefined | void)

export type SetState<IModel extends object> = Action<IModel, SetStatePayload<State<IModel>>>

export const setStateFactory = <IModel extends object>() => {
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
