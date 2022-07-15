import { runCommand } from '$ui/commands/run'
import { DEFAULT_NAME, getConfigFile, getConfigFileDisplay } from '$ui/util/gen'
import { useMemoizedFn } from 'ahooks'
import { Button, Col, Divider, Input, message, Row } from 'antd'
import launch from 'launch-editor'
import { useSnapshot } from 'valtio'
import { ConfigDND } from './ConfigDND'
import styles from './index.module.less'
import { state } from './model'

export default function ConfigList() {
  const { name } = useSnapshot(state)

  const onGenConfigClick = useMemoizedFn(async () => {
    return runCommand('generate')
  })

  const onOpenConfigClick = useMemoizedFn((editor = 'code') => {
    const file = getConfigFile(state.name)
    launch(
      // file
      file,
      // try specific editor bin first (optional)
      editor,
      // callback if failed to launch (optional)
      (fileName, errorMsg) => {
        message.error(errorMsg)
      }
    )
  })

  const spanLeft = 4
  const spanRight = 16

  return (
    <div className={styles.page}>
      <Divider orientation='left'>配置内容</Divider>
      <ConfigDND />

      <Divider orientation='left'>配置文件</Divider>
      <Row>
        <Col span={spanLeft}>
          <div
            className='label'
            style={{
              paddingRight: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              height: '32px',
            }}
          >
            配置名称
          </div>
        </Col>
        <Col span={spanRight}>
          <Input
            placeholder={DEFAULT_NAME}
            value={name}
            onChange={(e) => {
              const name = e.target.value
              state.name = name
            }}
          />
        </Col>
      </Row>

      <Row style={{ marginTop: 5 }}>
        <Col span={spanLeft}>
          <div
            className='label'
            style={{
              paddingRight: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              height: '32px',
            }}
          >
            文件地址
          </div>
        </Col>
        <Col span={spanRight}>
          <Input value={getConfigFileDisplay(name)} disabled />
        </Col>
      </Row>

      <Button
        type='primary'
        block
        shape='round'
        style={{ marginTop: '10px' }}
        onClick={onGenConfigClick}
      >
        生成
      </Button>

      <Button
        type='default'
        block
        shape='round'
        style={{ marginTop: '10px' }}
        onClick={() => onOpenConfigClick('code')}
      >
        打开(Code)
      </Button>
      <Button
        type='default'
        block
        shape='round'
        style={{ marginTop: '10px' }}
        onClick={() => onOpenConfigClick('atom')}
      >
        打开(Atom)
      </Button>
    </div>
  )
}
