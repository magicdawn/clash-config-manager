import {init} from '@rematch/core'
import immerPlugin from '@rematch/immer'
import statePlugin from '@magicdawn/x/rematch/state-plugin'

import * as models from './models'
import librarySubscribe from './page/library-subscribe/model/index'
import libraryRuleList from './page/library-rule-list/model/index'
import configList from './page/config-list/model/index'

const store = init({
  models: {...models, librarySubscribe, libraryRuleList, configList},
  plugins: [immerPlugin(), statePlugin()],
})

export default store

window.store = store
