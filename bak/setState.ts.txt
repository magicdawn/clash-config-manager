/* eslint-disable @typescript-eslint/ban-types */
import { Action, action, generic, Generic, State, thunk, Thunk } from 'easy-peasy'

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

export class BaseModel<Data> {
  data: Generic<Data> = null

  setData: Action<BaseModel<Data>, SetStatePayload<Data>> = action((state, payload) => {
    if (typeof payload === 'object') {
      Object.assign(state.data, payload)
      return
    }

    if (typeof payload === 'function') {
      const newdata = payload(state.data)
      if (newdata) {
        return { data: newdata }
      }
    }
  })
}

// const defaultState = {
//   x: 10,
// }
// const x = new (class M extends BaseModel<typeof defaultState> {
//   data = generic({ ...defaultState })

//   getData: Thunk<M> = thunk(({ setData: updateData }) => {
//     updateData((data) => {
//       // modify data
//       data.x++
//       // or return newdata
//       return { ...data, x: data.x + 1 }
//     })
//   })
// })()

export function defineModel<T>(
  defaultState: T,
  getOthers: (M: new () => BaseModel<T>) => new () => BaseModel<T>
) {
  class M extends BaseModel<T> {
    data = generic({ ...defaultState })
  }
  const DefinedModel = getOthers(M)
  return { ...new DefinedModel() }
}

// const y = defineModel(
//   defaultState,
//   (Base) =>
//     class M extends Base {
//       x: Thunk<M> = thunk((actions, payload, { getState }) => {
//         getState().data.x
//         actions.setData((d) => {
//           //
//         })
//       })
//     }
// )
