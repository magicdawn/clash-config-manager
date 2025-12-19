import { useMemoizedFn } from 'ahooks'
import { Button, Checkbox, Col, Divider, Input, Row, Tag, Tooltip } from 'antd'
import { shell } from 'electron'
import launch from 'launch-editor'
import { useSnapshot } from 'valtio'
import { runGenerate } from '$ui/modules/commands/run'
import { message } from '$ui/store'
import { ProxyGroupTypeConfig } from '$ui/types/ClashConfig'
import { DEFAULT_NAME, getConfigFile, getConfigFileDisplay } from '$ui/utility/generate'
import { ConfigDND } from './ConfigDND'
import styles from './index.module.less'
import { state } from './model'

export default function ConfigList() {
  const {
    name,
    clashMeta,
    generateAllProxyGroup,
    generateSubNameProxyGroup,
    generateSubNameFallbackProxyGroup,
    generatedGroupNameEmoji,
    generatedGroupNameLang,
  } = useSnapshot(state)

  const onGenConfigClick = useMemoizedFn(() => {
    return runGenerate()
  })

  const onOpenConfigClick = useMemoizedFn((editor = 'code') => {
    const file = getConfigFile(state.name, state.clashMeta)
    launch(
      // file
      file,
      // try specific editor bin first (optional)
      editor,
      // callback if failed to launch (optional)
      (fileName, errorMsg) => {
        message.error(errorMsg)
      },
    )
  })

  const onRevealInFinder = useMemoizedFn(() => {
    const file = getConfigFile(state.name, state.clashMeta)
    shell.showItemInFolder(file)
  })

  const spanLeft = 3
  const spanRight = 16

  const dividerFontSize = '1.2em'
  // const subTitleFontSize = '1.5em'
  const createDivider = (text: string) => (
    <div>
      <Divider titlePlacement='left'>
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
          <Input value={getConfigFileDisplay(name, clashMeta)} disabled />
        </Col>
      </Row>
      <Row style={{ marginTop: 8 }}>
        <div className='flex items-center justify-start flex-wrap gap-x-15px gap-y-1'>
          <Checkbox
            checked={clashMeta}
            onChange={(e) => {
              state.clashMeta = e.target.checked
            }}
          >
            <Tooltip title='生成到 ~/.config/clash.meta/ 文件夹'>为 Clash.Meta 生成</Tooltip>
          </Checkbox>

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
            <Tooltip title='默认会生成 SubName-最快 SubName-可用 SubName-选择, 是否再额外生成 SubName 组'>
              生成 <Tag className='mr-0'>订阅名同名</Tag> 组
            </Tooltip>
          </Checkbox>

          <Checkbox
            checked={generateSubNameFallbackProxyGroup}
            onChange={(e) => {
              state.generateSubNameFallbackProxyGroup = e.target.checked
            }}
          >
            <Tooltip title='Fallback 组不是很常用, 故可以省略'>
              生成 <Tag className='mr-0'>SubName-可用</Tag> 组
            </Tooltip>
          </Checkbox>

          <Checkbox
            checked={generatedGroupNameEmoji}
            onChange={(e) => {
              state.generatedGroupNameEmoji = e.target.checked
            }}
          >
            <Tag className='mr-0'>订阅组</Tag> emoji
          </Checkbox>

          <Checkbox
            checked={generatedGroupNameLang === 'zh'}
            onChange={(e) => {
              const lang = e.target.checked ? 'zh' : 'en'
              state.generatedGroupNameLang = lang
            }}
          >
            <Tooltip
              styles={{ container: { width: 'max-content' } }}
              title={
                <>
                  ✅ 使用中文: {ProxyGroupTypeConfig['url-test'].nameZh} / {ProxyGroupTypeConfig.fallback.nameZh} /{' '}
                  {ProxyGroupTypeConfig.select.nameZh}
                  <br />❎ 使用英文: {ProxyGroupTypeConfig['url-test'].nameEn} / {ProxyGroupTypeConfig.fallback.nameEn}{' '}
                  / {ProxyGroupTypeConfig.select.nameEn}
                </>
              }
            >
              <Tag style={{ marginRight: 0 }}>订阅组</Tag> 中文
            </Tooltip>
          </Checkbox>
        </div>
      </Row>

      <Button type='primary' block shape='round' style={{ marginTop: 8 }} onClick={onGenConfigClick}>
        生成
      </Button>
      <div className={styles.openBtns}>
        <Button type='default' shape='round' onClick={() => onOpenConfigClick('code')}>
          使用 vscode 打开
        </Button>
        <Button type='default' shape='round' onClick={() => onOpenConfigClick('subl')}>
          使用 subl 打开
        </Button>
        <Button type='default' shape='round' onClick={() => onRevealInFinder()}>
          在 Finder 中显示
        </Button>
      </div>
    </div>
  )
}
