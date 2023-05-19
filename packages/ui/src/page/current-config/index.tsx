import { runGenerate } from '$ui/commands/run'
import { message } from '$ui/store'
import { DEFAULT_NAME, getConfigFile, getConfigFileDisplay } from '$ui/util/gen'
import { useMemoizedFn } from 'ahooks'
import { Button, Checkbox, Col, Divider, Input, Row, Tag } from 'antd'
import { shell } from 'electron'
import launch from 'launch-editor'
import { useSnapshot } from 'valtio'
import { ConfigDND } from './ConfigDND'
import styles from './index.module.less'
import { state } from './model'

export default function ConfigList() {
  const { name, generateAllProxyGroup, generateSubNameProxyGroup } = useSnapshot(state)

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
    <div>
      <Divider orientation='left' orientationMargin={0}>
        <span style={{ fontSize: dividerFontSize }}>{text}</span>
      </Divider>
    </div>
  )

  return (
    <div className={styles.page}>
      {createDivider('配置内容')}
      <ConfigDND />

      {createDivider('配置文件')}

      <Row>
        <Col flex='auto' style={{ marginRight: 10 }}>
          <Row>
            <Col>
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
            <Col flex={1}>
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
            <Col>
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
            <Col flex={1}>
              <Input value={getConfigFileDisplay(name)} disabled />
            </Col>
          </Row>
        </Col>
        <Col flex='170px' style={{ textAlign: 'right' }}>
          <Checkbox
            checked={generateAllProxyGroup}
            onChange={(e) => {
              state.generateAllProxyGroup = e.target.checked
            }}
          >
            生成 <Tag style={{ marginRight: 0 }}>所有节点</Tag> 组
          </Checkbox>

          <Checkbox
            checked={generateSubNameProxyGroup}
            onChange={(e) => {
              state.generateSubNameProxyGroup = e.target.checked
            }}
          >
            生成 <Tag style={{ marginRight: 0 }}>订阅名同名</Tag> 组
          </Checkbox>
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
