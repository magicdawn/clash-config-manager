import React from 'react'
import { useMount, useMemoizedFn } from 'ahooks'
import { Button, Input, Row, Col, Divider, message } from 'antd'
import launch from 'launch-editor'
import { getConfigFileDisplay, getConfigFile, DEFAULT_NAME } from '$ui/util/fn/gen'
import { runCommand } from '$ui/commands/run'
import { useEasy } from '$ui/store'
import styles from './index.module.less'
import DndPlaygroud from './DndPlayground'

const namespace = 'currentConfig'

export default function ConfigList(props) {
  const currentConfigModel = useEasy('currentConfig')

  const onGenConfigClick = useMemoizedFn(async () => {
    return runCommand('generate')
  })

  const onOpenConfigClick = useMemoizedFn((editor = 'code') => {
    const file = getConfigFile(currentConfigModel.name)
    launch(
      // file
      file,

      // try specific editor bin first (optional)
      editor,

      (fileName, errorMsg) => {
        message.error(errorMsg)
      }
    )
  })

  return (
    <div className={styles.page}>
      <Divider orientation='left'>配置内容</Divider>
      <DndPlaygroud></DndPlaygroud>

      <Divider orientation='left'>配置文件</Divider>
      <Row>
        <Col span={4}>
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
        <Col span={10}>
          <Input
            placeholder={DEFAULT_NAME}
            value={currentConfigModel.name}
            onChange={(e) => {
              currentConfigModel.changeState({ name: e.target.value })
            }}
          />
        </Col>
      </Row>

      <Row style={{ marginTop: 5 }}>
        <Col span={4}>
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
        <Col span={10}>
          <Input value={getConfigFileDisplay(currentConfigModel.name)} disabled />
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
