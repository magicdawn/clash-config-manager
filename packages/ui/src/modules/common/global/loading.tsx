import { Modal } from 'antd'
import { useEffect, useState } from 'react'
import PacmanLoader from 'react-spinners/PacmanLoader'
import type { IterableElement } from 'type-fest'
import styles from './loading.module.less'
import { wrapComponent } from './wrapComponent'
import { randomInt } from 'es-toolkit'

const colors = [
  'orange',
  'yellow',
  'pink',
  '#1890ff', // from antd
] as const

function Loading({ visible }: { visible: boolean }) {
  const [color, setColor] = useState<IterableElement<typeof colors>>('orange')

  useEffect(() => {
    if (visible) {
      const newColor = colors[randomInt(colors.length)]
      setColor(newColor)
    }
  }, [visible])

  return (
    <Modal
      wrapClassName={styles.modal}
      open={visible}
      title={null}
      footer={null}
      centered
      closable={false}
      styles={{ body: { padding: 0, backgroundColor: 'transparent' } }}
    >
      <PacmanLoader color={color} size={100} />
    </Modal>
  )
}

const { WrappedComponent, proxyProps, wrapAction } = wrapComponent({
  C: Loading,
  defaultProps: { visible: false },
})

const show = wrapAction(() => {
  proxyProps.visible = true
})

const hide = wrapAction(() => {
  proxyProps.visible = false
})

export { WrappedComponent, hide, show }
export default { WrappedComponent, show, hide }

// setTimeout(() => {
//   show()
// }, 1000)
