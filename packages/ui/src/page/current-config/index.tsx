import { runGenerate } from '$ui/commands/run'
import { DEFAULT_NAME, getConfigFile, getConfigFileDisplay } from '$ui/util/gen'
import { useMemoizedFn } from 'ahooks'
import { Button, Col, Divider, Input, message, Row } from 'antd'
import { shell } from 'electron'
import launch from 'launch-editor'
import { useSnapshot } from 'valtio'
import { ConfigDND } from './ConfigDND'
import styles from './index.module.less'
import { state } from './model'

export default function ConfigList() {
  const { name } = useSnapshot(state)

  const onGenConfigClick = useMemoizedFn(async () => {
    return runGenerate()
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

  const onOpenInFinder = useMemoizedFn(() => {
    const file = getConfigFile(state.name)
    shell.showItemInFolder(file)
  })

  const spanLeft = 3
  const spanRight = 16

  const dividerFontSize = '1.2em'
  // const subTitleFontSize = '1.5em'
  const createDivider = (text: string) => (
    <Divider orientation='left' orientationMargin={0} style={{ margin: '10px 0 0 0' }}>
      <span style={{ fontSize: dividerFontSize }}>{text}</span>
    </Divider>
  )

  return (
    <div className={styles.page}>
      {createDivider('配置内容')}
      <ConfigDND />

      {createDivider('配置文件')}
      <Row>
        <Col span={spanLeft}>
          <div
            className='label'
            style={{
              paddingRight: 10,
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
              paddingRight: 10,
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
        style={{ marginTop: 8 }}
        onClick={onGenConfigClick}
      >
        生成
      </Button>
      <div className={styles.openBtns}>
        <Button type='default' shape='round' onClick={() => onOpenConfigClick('code')}>
          使用 vscode 打开
        </Button>
        <Button type='default' shape='round' onClick={() => onOpenConfigClick('subl')}>
          使用 subl 打开
        </Button>
        <Button type='default' shape='round' onClick={() => onOpenInFinder()}>
          在 Finder 中打开
        </Button>
      </div>
    </div>
  )
}
