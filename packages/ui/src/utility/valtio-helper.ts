import { cloneDeep } from 'es-toolkit'
import { proxy, snapshot, subscribe } from 'valtio'

export type Options<State> = {
  persist?: (state: State) => void
  load?: () => State
}

export function valtioState<State extends object>(initial: State, options?: Options<State>) {
  const state = proxy(initial)

  function setState(update: Partial<State>) {
    Object.assign(state, update)
  }

  function persist() {
    const data = cloneDeep(snapshot(state)) as State // prevent modification in `persist` cause `persist` again, infinite loop
    options?.persist?.(data)
  }

  const persistWatching = { val: false }
  subscribe(state, () => {
    if (!persistWatching.val) return
    persist()
  })

  function load() {
    if (!options?.load) return

    // turn off watch-and-persist
    persistWatching.val = false

    // setState & notify
    setState({ ...options.load() })

    // turn on watch-and-persist after setState listener called
    // 不能马上变成 true, 因为 persist guard 是在 Promise.resolve().then 宏任务里调用的
    // 这样写上面的 load 之后的第一次 persistWatching 就是 false, 确保因为 load() 导致的 state 变化不会调用 persist
    Promise.resolve().then(() => {
      persistWatching.val = true
    })
  }

  let loaded = false
  function init() {
    if (loaded) return
    load()
    loaded = true
  }

  return {
    state,
    setState,

    init, // load once when start
    load, // manual load
    persist, // manual persist

    persistWatching, // pause persist?
  }
}
