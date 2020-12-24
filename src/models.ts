import {Models} from '@rematch/core'

import librarySubscribe from './page/library-subscribe/model/index'
import libraryRuleList from './page/library-rule-list/model/index'
import currentConfig from './page/current-config/model/index'
import preference from './page/preference/model/index'

export interface RootModel extends Models<RootModel> {
  librarySubscribe: typeof librarySubscribe
  libraryRuleList: typeof libraryRuleList
  currentConfig: typeof currentConfig
  preference: typeof preference
}

export const models: RootModel = {librarySubscribe, libraryRuleList, currentConfig, preference}
