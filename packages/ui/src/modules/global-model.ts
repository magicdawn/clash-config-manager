import Emitter from 'emittery'
import { type NavigateFunction } from 'react-router'

export const globalEmitter = new Emitter<{ init: undefined; reload: undefined }>()

// : Parameters<NavigateFunction> 有重载的情况不准确
const navigate: NavigateFunction = function (...args) {
  // @ts-ignore
  navigateSingleton?.(...args)
}

// actions
export const actions = {
  init,
  reload,

  // router navigate
  navigate,
}

let inited = false
function init() {
  if (inited) return
  globalEmitter.emit('init')
  inited = true
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

export let navigateSingleton: NavigateFunction | null = null
export function setNavigateSingleton(nav: NavigateFunction) {
  navigateSingleton = nav
}
