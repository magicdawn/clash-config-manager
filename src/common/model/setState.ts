import {Action, action} from 'easy-peasy'

export type SetStatePayload<IState> =
  | Partial<IState>
  | ((state: IState) => IState | undefined | void)

export type SetState<IModel extends Object, IState> = Action<IModel, SetStatePayload<IState>>

export const setState = <IModel, IState>() => {
  return action((state, payload) => {
    if (typeof payload === 'object') {
      Object.assign(state, payload)
      return
    }

    if (typeof payload === 'function') {
      const ret = payload(state as IState)
      return ret
    }
  }) as SetState<IModel, IState>
}
