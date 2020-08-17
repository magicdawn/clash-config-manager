import {init} from '@rematch/core'
import immerPlugin from '@rematch/immer'

import * as models from './models'
import librarySubscribe from './page/library-subscribe/model/index'

const store = init({
  models: {...models, librarySubscribe},
  plugins: [immerPlugin()],
})

export default store
