import {thunk} from 'easy-peasy'
import {Thunk} from 'easy-peasy'

export default new (class GlobalModel {
  init: Thunk<GlobalModel> = thunk(() => {})
  reload: Thunk<GlobalModel> = thunk(() => {})
})()
