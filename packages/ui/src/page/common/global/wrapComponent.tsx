import { ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { proxy, useSnapshot } from 'valtio'

export function wrapComponent<IProps extends object>({
  component,
  defaultProps,
}: {
  component: ComponentType<IProps>
  defaultProps: IProps
}) {
  const proxyProps = proxy<IProps>(defaultProps)

  const C = component

  function WrappedComponent() {
    const props = useSnapshot(proxyProps)
    return <C {...props} />
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
