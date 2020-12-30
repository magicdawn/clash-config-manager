import {thunk} from 'easy-peasy'
import {Thunk} from 'easy-peasy'

interface GlobalModel {
  init: Thunk<GlobalModel>
  reload: Thunk<GlobalModel>
}

const globalModel: GlobalModel = {
  init: thunk(() => {}),
  reload: thunk(() => {}),
}

export default globalModel
