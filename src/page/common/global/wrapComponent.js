import React, {useEffect, useCallback, useState} from 'react'
import {render} from 'react-dom'
import {BehaviorSubject} from 'rxjs'
import {useModifyState} from '@x/react/hooks'
import {withProps} from 'recompose'

export default function wrap({component, defaultProps, withProps: withPropsOptions}) {
  const subject = new BehaviorSubject()
  let C = component

  if (withPropsOptions) {
    C = withProps(withPropsOptions)(C)
  }

  function WrappedComponent() {
    const [props, setProps] = useModifyState(defaultProps)

    useEffect(() => {
      const subscription = subject.subscribe((val) => setProps(val))
      return () => {
        subscription.unsubscribe()
      }
    }, [])

    return <C {...props} setProps={setProps} />
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
    const fn = factory({setProps: (val) => subject.next(val)})
    return function () {
      mount()
      fn()
    }
  }

  return {
    subject,
    WrappedComponent,
    mount,
    createMethod,
  }
}
