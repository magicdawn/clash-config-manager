import { useMemoizedFn, useUpdateEffect } from 'ahooks'
import { AutoComplete, Button, Col, Input, message, Modal, Row, Select, Space } from 'antd'
import AppleScript from 'applescript'
import { clipboard } from 'electron'
import Yaml from 'js-yaml'
import pify from 'promise.ify'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { tldExists } from 'tldjs'
import URI from 'urijs'
import { useSnapshot } from 'valtio'
import { state } from './model'

const { Option } = Select

// from-rule: 从规则编辑中打开
// from-global: 从主页中直接打开
export type Mode = 'from-rule' | 'from-global'

type ClashRuleType = 'DOMAIN-SUFFIX' | 'DOMAIN-KEYWORD'
const TYPES: ClashRuleType[] = ['DOMAIN-SUFFIX', 'DOMAIN-KEYWORD']

const TARGETS = ['Proxy', 'DIRECT', 'REJECT']

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

      const obj = Yaml.load(item.content) as object
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
   * source url
   */

  const [processUrl, setProcessUrl] = useState('')
  const [autoCompletes, setAutoCompletes] = useState<Record<ClashRuleType, string[]>>(() => ({
    'DOMAIN-KEYWORD': [],
    'DOMAIN-SUFFIX': [],
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

  const readClipboardUrl = useCallback(() => {
    const url = clipboard.readText()
    if (url) {
      changeProcessUrl(url)
    }
  }, [])

  const readChromeUrl = useCallback(async () => {
    const url = await getChromeUrl()
    if (url) {
      message.success('获取 chrome url 成功')
      changeProcessUrl(url)
    }
  }, [])

  // default use chrome url
  useUpdateEffect(() => {
    if (visible) {
      readChromeUrl()
    }
  }, [visible])

  /**
   * rule detail
   */

  const [type, setType] = useState<ClashRuleType>(TYPES[0])
  const [url, setUrl] = useState('')
  const [target, setTarget] = useState(TARGETS[0])

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

  const layout = [{ span: 7 }, { flex: 1 }, { span: 4 }]

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
      keyboard={false}
      maskClosable={false}
      title='添加规则'
      width={'95vw'}
      bodyStyle={{ padding: '24px 12px' }}
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
          <Button onClick={readClipboardUrl}>从剪贴板读取</Button>
          <Button type='primary' onClick={readChromeUrl}>
            从 Google Chrome 读取
          </Button>
        </Space>
      </div>

      <Row gutter={8} style={{ marginTop: 24 }}>
        <Col {...layout[0]}>类型</Col>
        <Col {...layout[1]}>URL</Col>
        <Col {...layout[2]}>Target</Col>
      </Row>

      <Row gutter={8}>
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
          <AutoComplete value={url} onChange={setUrl} style={{ width: '100%' }}>
            {url && !curAutoCompletes.includes(url) && (
              <Option key={`${type}-custom`} value={url}>
                {url}
              </Option>
            )}
            {curAutoCompletes.map((t) => (
              <Option key={`${type}-${t}`} value={t}>
                {t}
              </Option>
            ))}
          </AutoComplete>
        </Col>

        <Col {...layout[2]}>
          <AutoComplete value={target} onChange={setTarget} style={{ width: '100%' }}>
            {!TARGETS.includes(target) && (
              <Option key='custom' value={target}>
                {target}
              </Option>
            )}
            {TARGETS.map((t) => (
              <Option key={t} value={t}>
                {t}
              </Option>
            ))}
          </AutoComplete>
        </Col>
      </Row>

      {mode === 'from-global' && (
        <>
          <Row gutter={8} style={{ marginTop: 24 }}>
            <Col {...layout[0]}>添加至</Col>
          </Row>
          <Row gutter={8}>
            <Col {...layout[0]}>
              <Select style={{ width: '100%' }} value={ruleId} onChange={(val) => setRuleId(val)}>
                {ruleList.map((t) => (
                  <Option key={t.id} value={t.id}>
                    {t.name}
                  </Option>
                ))}
              </Select>
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

// FIXME
// global.URI = URI

function getAutoCompletes(url: string) {
  const u = new URI(url)
  // const fullDomain = u.domain() // full domain, e.g www.githug.com
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
  }
}
