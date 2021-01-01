import {thunk, Thunk} from 'easy-peasy'

export default new (class GlobalModel {
  init: Thunk<GlobalModel> = thunk(() => {})
  reload: Thunk<GlobalModel> = thunk(() => {})
})()
