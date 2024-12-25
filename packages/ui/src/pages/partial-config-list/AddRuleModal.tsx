import { message } from '$ui/store'
import { genConfig } from '$ui/utility/gen'
import { css } from '@emotion/react'
import { useMemoizedFn, useUpdateEffect } from 'ahooks'
import { AutoComplete, Button, Col, Input, Modal, Row, Select, Space } from 'antd'
import AppleScript from 'applescript'
import { clipboard } from 'electron'
import Yaml from 'js-yaml'
import { uniq } from 'es-toolkit'
import { size } from 'polished'
import pify from 'promise.ify'
import { tryit } from 'radash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { tldExists } from 'tldjs'
import URI from 'urijs'
import { useSnapshot } from 'valtio'
import LineMdConfirm from '~icons/line-md/confirm'
import { state } from './model'

const { Option } = Select

// from-rule: 从规则编辑中打开
// from-global: 从主页中直接打开
export type Mode = 'from-rule' | 'from-global'

type ClashRuleType = 'DOMAIN-SUFFIX' | 'DOMAIN-KEYWORD' | 'DOMAIN'
const TYPES: ClashRuleType[] = ['DOMAIN-SUFFIX', 'DOMAIN-KEYWORD', 'DOMAIN']

const DEFAULT_TARGETS = ['Proxy', 'DIRECT', 'REJECT']

interface IProps {
  visible: boolean
  setVisible: (val: boolean) => void
  onOk?: (rule: string, targetRuleId?: string) => void
  mode?: Mode
}

export default function AddRuleModal(props: IProps) {
  const { visible, setVisible, onOk, mode = 'from-rule' } = props

  const { list: fullList } = useSnapshot(state)

  const ruleList = useMemo(() => {
    const list = fullList.filter((item) => {
      if (mode !== 'from-global') return false

      if (!(item.type === 'local' && item.content)) {
        return false
      }

      // too long, skip it
      if (item.content.length > 20 * 10000) {
        return false
      }

      const [err, obj] = tryit(Yaml.load)(item.content)
      if (!obj) {
        return false
      }

      if (Object.keys(obj).length === 1 && Object.keys(obj).includes('rules')) {
        return true
      } else {
        return false
      }
    })
    return list
  }, [fullList])

  const [ruleId, setRuleId] = useState(ruleList[0]?.id || '')

  const handleOk = useMemoizedFn(() => {
    setVisible(false)
    const rule = `${type},${url},${target}`
    onOk?.(rule, ruleId)
  })

  const handleCancel = useMemoizedFn(() => {
    setVisible(false)
  })

  /**
   * rule detail
   */

  const [type, setType] = useState<ClashRuleType>(TYPES[0])
  const [url, setUrl] = useState('')
  const [target, setTarget] = useState(DEFAULT_TARGETS[0])

  const [extraTargets, setExtraTargets] = useState<string[]>([])
  const [targetAutoCompleteList, setTargetAutoCompleteList] = useState<string[]>([])

  const allTargets = useMemo(
    () => uniq([target, ...DEFAULT_TARGETS, ...extraTargets].filter(Boolean)),
    [target, extraTargets],
  )

  /**
   * source url
   */

  const [processUrl, setProcessUrl] = useState('')
  const [autoCompletes, setAutoCompletes] = useState<Record<ClashRuleType, string[]>>(() => ({
    'DOMAIN-KEYWORD': [],
    'DOMAIN-SUFFIX': [],
    'DOMAIN': [],
  }))

  const changeProcessUrl = useMemoizedFn((url: string) => {
    if (!url || !tldExists(url)) return

    // add silly `http://` if needed
    if (!url.includes(':')) {
      url = 'http://' + url
    }

    setProcessUrl(url)
    const data = getAutoCompletes(url)
    setAutoCompletes(data)
  })

  const useClipboardUrl = useCallback(() => {
    const url = clipboard.readText()
    if (url) {
      changeProcessUrl(url)
    }
  }, [])

  const useChromeUrl = useCallback(async () => {
    const url = await getChromeUrl()
    if (url) {
      message.success('获取 chrome url 成功')
      changeProcessUrl(url)
    }
  }, [])

  const updateExtraTargets = useMemoizedFn(async () => {
    const config = await genConfig()
    const proxyGroupNames = (config['proxy-groups'] || []).map((x) => x.name)
    setExtraTargets(proxyGroupNames)
    await new Promise<void>((resolve) => setTimeout(resolve))
    resetTargetAutoCompleteList()
  })

  const resetTargetAutoCompleteList = useMemoizedFn(() => {
    setTargetAutoCompleteList(allTargets)
  })

  // default use chrome url
  useUpdateEffect(() => {
    if (visible) {
      useChromeUrl()
      updateExtraTargets()
    }
  }, [visible])

  const onSearchTargets = useMemoizedFn((text: string) => {
    // TODO: add fuzzy search

    if (!text) {
      setTargetAutoCompleteList([])
      return
    }

    const _text = text
    text = text.toLowerCase()
    const searchFrom = uniq(extraTargets)
    const filtered = uniq([
      _text,
      ...DEFAULT_TARGETS,
      ...searchFrom.filter((name) => {
        return name.toLowerCase().startsWith(text)
      }),
      ...searchFrom.filter((name) => {
        return name.toLowerCase().includes(text)
      }),
    ])

    setTargetAutoCompleteList(filtered)
  })

  const curAutoCompletes = useMemo(() => {
    return autoCompletes[type] || []
  }, [autoCompletes, type])

  useEffect(() => {
    if (curAutoCompletes[0]) {
      setUrl(curAutoCompletes[0])
    }
  }, [curAutoCompletes])

  /**
   * ui style
   */

  const layout = [{ span: 6 }, { flex: 1 }, { span: 6 }]

  const okButtonProps = useMemo(() => {
    const disabled = !(type && target && url)
    return {
      disabled,
    }
  }, [type, target, url])

  return (
    <Modal
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      keyboard={true}
      maskClosable={false}
      title='添加规则'
      width={'95vw'}
      styles={{ body: { padding: '24px 12px' } }}
      okButtonProps={okButtonProps}
      destroyOnClose
      okText={mode === 'from-global' ? '添加并重新生成' : '确定'}
    >
      <Input
        style={{ flex: 1 }}
        addonBefore='源URL'
        value={processUrl}
        onChange={(e) => setProcessUrl(e.target.value)}
      />
      <div style={{ marginTop: 10 }}>
        <Space direction='horizontal'>
          <Button onClick={useClipboardUrl}>从剪贴板读取</Button>
          <Button type='primary' onClick={useChromeUrl}>
            从 Google Chrome 读取
          </Button>
        </Space>
      </div>

      <Row gutter={8} style={{ marginTop: 24 }}>
        <Col {...layout[0]}>类型</Col>
        <Col {...layout[1]}>URL</Col>
        <Col {...layout[2]}>Target</Col>
      </Row>

      <Row gutter={8} style={{ marginTop: 4 }}>
        <Col {...layout[0]}>
          <Select value={type} onChange={(val) => setType(val)} style={{ width: '100%' }}>
            {TYPES.map((t) => (
              <Option key={t} value={t}>
                {t}
              </Option>
            ))}
          </Select>
        </Col>

        <Col {...layout[1]}>
          <AutoComplete
            value={url}
            onChange={setUrl}
            style={{ width: '100%' }}
            options={curAutoCompletes.map((value) => ({ value }))}
          />
        </Col>

        <Col {...layout[2]}>
          <AutoComplete
            value={target}
            onChange={setTarget}
            style={{ width: '100%' }}
            options={(!target ? allTargets : targetAutoCompleteList).map((value) => ({ value }))}
            onSearch={onSearchTargets}
            onSelect={resetTargetAutoCompleteList}
            allowClear
          />
        </Col>
      </Row>

      {mode === 'from-global' && (
        <>
          <Row gutter={8} style={{ marginTop: 24 }}>
            <Col {...layout[0]}>添加至</Col>
          </Row>
          <Row gutter={8} style={{ marginTop: 4 }}>
            <Col span={24}>
              {/* <Select style={{ width: '100%' }} value={ruleId} onChange={(val) => setRuleId(val)}>
                {ruleList.map((t) => (
                  <Option key={t.id} value={t.id}>
                    {t.name}
                  </Option>
                ))}
              </Select> */}

              <div
                css={css`
                  display: flex;
                  flex-wrap: wrap;
                  gap: 8px 8px;
                `}
              >
                {ruleList.map((t) => {
                  const active = t.id === ruleId

                  return (
                    <div
                      className='option'
                      key={t.id}
                      data-value={t.id}
                      onClick={(e) => setRuleId(t.id)}
                      css={[
                        css`
                          position: relative;

                          display: flex;
                          align-items: center;
                          justify-content: center;

                          padding: 15px 15px;
                          border: 1px solid #ddd;
                          border-radius: 8px;
                          min-width: 100px;
                          cursor: pointer;
                          overflow: hidden;

                          .dark-theme & {
                            border-color: #333;
                          }
                        `,
                        active &&
                          css`
                            transition-property: background-color, color;
                            transition-duration: 0.3s;
                            transition-timing-function: ease-in-out;

                            background-color: var(--ant-color-primary);
                            color: #fff;
                          `,
                      ]}
                    >
                      {active && (
                        <LineMdConfirm
                          {...size(20)}
                          css={css`
                            margin-right: 5px;
                          `}
                        />
                      )}
                      {t.name}
                    </div>
                  )
                })}
              </div>
            </Col>
          </Row>
        </>
      )}
    </Modal>
  )
}

async function getChromeUrl() {
  const script = `
		tell application "Google Chrome"
			get URL of active tab of first window
		end tell
	`
  const result = (await pify(AppleScript.execString, AppleScript)(script.trim())) as string[]
  const url = result && result[0]
  return url
}

function getAutoCompletes(url: string) {
  const u = new URI(url)
  // const fullDomain = u.domain() // full domain, e.g www.github.com
  // const shortDomain = u.domain(true) // without subdomain, e.g github.com
  // const keyword = shortDomain.split('.')[0] // e.g github

  const hostname = u.hostname() // www.github.com
  const tld = u.tld() // com

  const suffixes: string[] = []
  let cur = hostname
  do {
    suffixes.push(cur)
    cur = cur.replace(/^[\w_-]+?\./, '')
  } while (cur && cur !== tld)

  const keywords = [
    ...hostname
      .slice(0, -tld.length)
      .split('.')
      .filter(Boolean)
      .filter((x) => x !== 'www'),
  ]

  return {
    'DOMAIN-KEYWORD': keywords,
    'DOMAIN-SUFFIX': suffixes,
    'DOMAIN': [hostname],
  }
}
