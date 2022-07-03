import Emitter from 'emittery'
import { proxy } from 'valtio'

export const globalEmitter = new Emitter<{ init: undefined; reload: undefined }>()

// actions
export const actions = { init, reload }
function init() {
  globalEmitter.emit('init')
}
function reload() {
  globalEmitter.emit('reload')
}

// for define models
export function onInit(cb: () => void) {
  globalEmitter.on('init', cb)
}
export function onReload(cb: () => void) {
  globalEmitter.on('reload', cb)
}

const state = proxy({
  count: 0,
  name: 'foo',
  inc: () => {
    ++state.count
  },
  setName: (name) => {
    state.name = name
  },
})
