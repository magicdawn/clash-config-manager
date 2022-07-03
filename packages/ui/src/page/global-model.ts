import Emitter from 'emittery'

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
