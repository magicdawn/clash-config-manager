import { Modal } from 'antd'
import _ from 'lodash'
import { useEffect, useState } from 'react'
import PacmanLoader from 'react-spinners/PacmanLoader'
import styles from './loading.module.less'
import { wrapComponent } from './wrapComponent'

const colors = [
  'orange',
  'yellow',
  'pink',
  '#1890ff', // from antd
]

// FIXME:
// eslint-disable-next-line react/prop-types
function Loading({ visible }) {
  const [color, setColor] = useState('orange')

  useEffect(() => {
    if (visible) {
      const newColor = colors[_.random(0, colors.length - 1)]
      setColor(newColor)
    }
  }, [visible])

  return (
    <Modal
      wrapClassName={styles.modal}
      visible={visible}
      title={null}
      footer={null}
      centered
      closable={false}
      bodyStyle={{ padding: 0, backgroundColor: 'transparent' }}
    >
      <PacmanLoader color={color} size={100} />
    </Modal>
  )
}

const { WrappedComponent, proxyProps, wrapAction } = wrapComponent({
  component: Loading,
  defaultProps: { visible: false },
})

const show = wrapAction(() => {
  proxyProps.visible = true
})

const hide = wrapAction(() => {
  proxyProps.visible = false
})

export { WrappedComponent, show, hide }
export default { WrappedComponent, show, hide }

// setTimeout(() => {
//   show()
// }, 1000)
