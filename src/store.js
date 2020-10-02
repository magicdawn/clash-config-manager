import {init} from '@rematch/core'
import immerPlugin from '@rematch/immer'
import statePlugin from '@magicdawn/x/rematch/state-plugin'
import listenPlugin from './util/rematch-listen-plugin'

import * as models from './models'
import librarySubscribe from './page/library-subscribe/model/index'
import libraryRuleList from './page/library-rule-list/model/index'
import currentConfig from './page/current-config/model/index'
import preference from './page/preference/model/index'

const globalModule = {
  state: {},
  effects: {
    init() {},
    reload() {},
  },
}

const store = init({
  models: {
    ...models,
    librarySubscribe,
    libraryRuleList,
    currentConfig,
    preference,
    global: globalModule,
  },
  plugins: [immerPlugin(), statePlugin(), listenPlugin()],
})

export default store

// fixme
// window.store = store
