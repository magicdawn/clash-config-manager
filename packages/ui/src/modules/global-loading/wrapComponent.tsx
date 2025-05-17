import { createRoot } from 'react-dom/client'
import { proxy, useSnapshot } from 'valtio'
import type { ComponentType } from 'react'

export function wrapComponent<IProps extends object>({
  Component,
  defaultProps,
}: {
  Component: ComponentType<IProps>
  defaultProps: IProps
}) {
  const proxyProps = proxy<IProps>(defaultProps)

  function WrappedComponent() {
    const props = useSnapshot(proxyProps)
    // https://github.com/emotion-js/emotion/issues/3245
    // @ts-ignore
    return <Component {...props} />
  }

  let mounted = false
  function mount() {
    if (mounted) return
    const div = document.createElement('div')
    document.body.appendChild(div)
    createRoot(div).render(<WrappedComponent />)
    mounted = true
  }

  function wrapAction<T extends (...args: any[]) => any>(action: T) {
    return (...args: Parameters<T>): ReturnType<T> => {
      mount()
      return action(...args)
    }
  }

  return {
    WrappedComponent,
    proxyProps,
    mount,
    wrapAction,
  }
}
