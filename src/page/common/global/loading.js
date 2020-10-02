import {Modal} from 'antd'
import React from 'react'
import wrap from './wrapComponent'
import PacmanLoader from 'react-spinners/PacmanLoader'
import styles from './loading.module.less'

// import Spinner from 'react-spinkit'
/* <Spinner name='pacman' color='#1890ff' className={styles.spin} /> */

function Loading({visible}) {
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
      {/* #1890ff antd */}
      <PacmanLoader color='orange' size={100} css={{marginLeft: -300, marginTop: -100}} />
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
