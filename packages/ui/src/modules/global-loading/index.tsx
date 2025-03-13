import { css } from '@emotion/react'
import { Modal } from 'antd'
import { randomInt } from 'es-toolkit'
import { useEffect, useState, type ReactNode } from 'react'
import { ClimbingBoxLoader, GridLoader, HashLoader, PacmanLoader } from 'react-spinners'
import { wrapComponent } from './wrapComponent'

const possibleColors = [
  'orange',
  'yellow',
  'pink',
  '#1890ff', // from antd
] as const
type Color = (typeof possibleColors)[number]

const S = {
  modal: css``,
}

type SpinerFactory = (color: Color) => ReactNode

const possibleSpiners: SpinerFactory[] = [
  (color) => (
    <div className='w-500px'>
      <PacmanLoader color={color} size={100} />
    </div>
  ),
  (color) => <HashLoader color={color} size={160} />,
  (color) => <ClimbingBoxLoader color={color} size={50} />,
  (color) => <GridLoader color={color} size={50} />,
]

function Loading({ visible }: { visible: boolean }) {
  const [color, setColor] = useState<Color>(possibleColors[0])
  const [spiner, setSpiner] = useState<SpinerFactory>(() => possibleSpiners[0])

  useEffect(() => {
    if (!visible) return
    setColor(possibleColors[randomInt(possibleColors.length)])
    setSpiner(() => possibleSpiners[randomInt(possibleSpiners.length)])
  }, [visible])

  return (
    <Modal
      width={'max-content'}
      css={S.modal}
      open={visible}
      title={null}
      footer={null}
      centered
      closable={false}
      styles={{
        content: { backgroundColor: 'transparent', padding: 0, boxShadow: 'none' },
        body: { backgroundColor: 'transparent', padding: 0 },
      }}
    >
      {spiner(color)}
    </Modal>
  )
}

const { WrappedComponent, proxyProps, wrapAction } = wrapComponent({
  Component: Loading,
  defaultProps: { visible: false },
})

const show = wrapAction(() => {
  proxyProps.visible = true
})

const hide = wrapAction(() => {
  proxyProps.visible = false
})

export { hide, show, WrappedComponent }

const GlobalLoading = {
  show,
  hide,
  WrappedComponent,
}
export default GlobalLoading

// setTimeout(() => {
//   show()
// }, 1000)
