// https://github.com/rematch/rematch/issues/231#issuecomment-695183139
export default ({onError = console.error} = {}) => {
  const listenRegistry = {}
  const addListen = ({actionType, fn}) => {
    if (!listenRegistry[actionType]) {
      listenRegistry[actionType] = []
    }

    if (listenRegistry[actionType].includes(fn)) {
      return
    }

    listenRegistry[actionType].push(fn)
  }

  return {
    createMiddleware: (bag) => (store) => (next) => (action) => {
      const actionType = action.type
      const shouldHandle = listenRegistry[actionType] && listenRegistry[actionType].length

      if (!shouldHandle) {
        return next(action)
      }

      // reducer first
      next(action)

      // call listening effects function
      const {payload} = action
      const rootState = store.getState()
      return Promise.all(
        listenRegistry[actionType].map(async (fn) => {
          // indepenent
          try {
            return await fn(payload, rootState)
          } catch (e) {
            onError(e)
            return e
          }
        })
      )
    },

    onModel(model, store) {
      const {name} = model
      const {dispatch} = store
      const modelDispatcher = dispatch[name]

      let listen = model.listen
      if (listen) {
        if (typeof listen === 'function') {
          listen = listen(dispatch)
        }

        // listen: { [action]: { xxx } }
        for (let [actionType, fn] of Object.entries(listen)) {
          addListen({
            actionType,
            fn: fn.bind(modelDispatcher),
          })
        }
      }
    },
  }
}
