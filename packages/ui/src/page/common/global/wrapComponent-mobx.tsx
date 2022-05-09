import React from 'react'
import { render } from 'react-dom'
import { withProps } from 'recompose'
import { Observer } from 'mobx-react'
import { makeAutoObservable } from 'mobx'

export default function wrap<C, T>({
  component,
  defaultProps,
  withProps: withPropsOptions,
}: {
  component: any
  defaultProps: T
  withProps: any
}) {
  let C = component

  if (withPropsOptions) {
    C = withProps(withPropsOptions)(C)
  }

  const store = new (class {
    constructor() {
      makeAutoObservable(this)
    }
    props = { ...defaultProps }
    setProps(newProps: Partial<T>) {
      Object.assign(this.props, newProps)
    }
  })()

  ;(window as any).wrap_mobx_store = store
  debugger

  function WrappedComponent() {
    return (
      <Observer>
        {() => {
          const { props, setProps } = store
          return <C {...props} setProps={setProps} />
        }}
      </Observer>
    )
  }

  let mounted = false
  function mount() {
    if (mounted) return
    const div = document.createElement('div')
    document.body.appendChild(div)
    render(<WrappedComponent />, div)
    mounted = true
  }

  function createMethod(factory) {
    const fn = factory({ setProps: (val) => store.setProps(val) })
    return function () {
      mount()
      fn()
    }
  }

  return {
    WrappedComponent,
    mount,
    createMethod,
  }
}
