import React, {useState, useEffect} from 'react'
import {Modal} from 'antd'
import wrap from './wrapComponent'
import PacmanLoader from 'react-spinners/PacmanLoader'
import styles from './loading.module.less'
import _ from 'lodash'

// import Spinner from 'react-spinkit'
/* <Spinner name='pacman' color='' className={styles.spin} /> */

const colors = [
  'orange',
  'yellow',
  'pink',
  '#1890ff', // antd
]

function Loading({visible}) {
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
      bodyStyle={{padding: 0, backgroundColor: 'transparent'}}
    >
      <PacmanLoader
        color={color}
        size={100}
        css={`
          margin-left: -300px;
          margin-top: -100px;
        `}
      />
    </Modal>
  )
}

const {subject, WrappedComponent, createMethod} = wrap({
  component: Loading,
  defaultProps: {visible: false},
  withProps({setProps}) {
    return {
      setVisible(val) {
        setProps({visible: val})
      },
    }
  },
})

const show = createMethod(({setProps}) => () => {
  setProps({visible: true})
})

const hide = createMethod(({setProps}) => () => {
  setProps({visible: false})
})

export {subject, WrappedComponent, show, hide}
export default {subject, WrappedComponent, show, hide}
