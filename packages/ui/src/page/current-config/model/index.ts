import _ from 'lodash'
import {Action, thunk, Thunk, thunkOn, ThunkOn} from 'easy-peasy'
import storage from '@ui/storage'
import {ConfigItem} from '@ui/common/define'
import {setStateFactory, SetStatePayload} from '@ui/common/model/setState'
import {StoreModel} from '@ui/store'

const CURRENT_CONFIG_STORAGE_KEY = 'current_config_v2'

interface IState {
  inited: boolean
  list: ConfigItem[]
  name: string
  forceUpdate: boolean
}

export default new (class CurrentConfigModel implements IState {
  inited = false
  list = []
  name = ''
  forceUpdate = true

  setState: Action<CurrentConfigModel, SetStatePayload<IState>> = setStateFactory()

  onInit: ThunkOn<CurrentConfigModel, any, StoreModel> = thunkOn(
    (_, storeActions) => storeActions.global.init,
    (actions) => {
      actions.init()
    }
  )
  onReload: ThunkOn<CurrentConfigModel, any, StoreModel> = thunkOn(
    (_, storeActions) => storeActions.global.reload,
    (actions) => {
      actions.load()
    }
  )

  load: Thunk<CurrentConfigModel> = thunk((actions) => {
    const storeValues = storage.get(CURRENT_CONFIG_STORAGE_KEY)
    actions.setState({inited: true, ...storeValues})
  })

  persist: Thunk<CurrentConfigModel> = thunk((actions, payload, {getState}) => {
    storage.set(CURRENT_CONFIG_STORAGE_KEY, _.omit(getState(), ['inited']))
  })

  init: Thunk<CurrentConfigModel> = thunk((actions, _, {getState}) => {
    const {inited} = getState()
    if (inited) return
    actions.load()
  })

  modifyList: Thunk<CurrentConfigModel, (list: ConfigItem[]) => void> = thunk(
    (actions, payload) => {
      actions.changeState((slice) => {
        payload(slice.list)
      })
    }
  )

  changeState: Thunk<CurrentConfigModel, SetStatePayload<IState>> = thunk((actions, payload) => {
    actions.setState(payload)
    actions.persist()
  })
})()
