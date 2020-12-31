import React, {useState, useEffect, useCallback, useMemo} from 'react'
import {usePersistFn} from 'ahooks'
import {Modal, Row, Col, Select, AutoComplete, Input, Button, Space, message} from 'antd'
import {clipboard} from 'electron'
import URI from 'urijs'

const {Option} = Select

interface IProps {
  visible: boolean
  setVisible: (val: boolean) => void
  onOk?: (rule: string) => void
}

export default function AddRuleModal(props: IProps) {
  /**
   * modal
   */
  const {visible, setVisible, onOk} = props

  const handleOk = usePersistFn(() => {
    setVisible(false)
    const rule = `${type},${url},${target}`
    onOk?.(rule)
  })

  const handleCancel = usePersistFn(() => {
    setVisible(false)
  })

  /**
   * source url
   */

  const [processUrl, setProcessUrl] = useState('')
  const [autoCompletes, setAutoCompletes] = useState({})

  const changeProcessUrl = usePersistFn((u) => {
    setProcessUrl(u)
    const data = getAutoCompletes(u)
    setAutoCompletes(data)
  })

  const readClipboardUrl = useCallback(() => {
    const url = clipboard.readText()
    changeProcessUrl(url)
  }, [])

  const readChromeUrl = useCallback(() => {
    ;(async () => {
      const url = await getChromeUrl()
      if (url) {
        message.success('获取 chrome url 成功')
        changeProcessUrl(url)
      }
    })()
  }, [])

  /**
   * rule detail
   */

  const TYPES = ['DOMAIN-SUFFIX', 'DOMAIN-KEYWORD']
  const TARGETS = ['Proxy', 'DIRECT']
  const [type, setType] = useState(TYPES[0])
  const [url, setUrl] = useState('')
  const [target, setTarget] = useState(TARGETS[0])

  const curAutoCompletes = autoCompletes[type] || []
  useEffect(() => {
    if (curAutoCompletes[0]) {
      setUrl(curAutoCompletes[0])
    }
  }, [curAutoCompletes, setUrl])

  /**
   * ui style
   */

  const layout = [{span: 7}, {flex: 1}, {span: 4}]

  const okButtonProps = useMemo(() => {
    const disabled = !(type && target && url)
    return {
      disabled,
    }
  }, [type, target, url])

  return (
    <Modal
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      keyboard={false}
      maskClosable={false}
      title='添加规则'
      width={'95vw'}
      bodyStyle={{padding: '24px 12px'}}
      okButtonProps={okButtonProps}
      destroyOnClose
    >
      <Input
        style={{flex: 1}}
        addonBefore='源URL'
        value={processUrl}
        onChange={(e) => setProcessUrl(e.target.value)}
      />
      <div style={{marginTop: 10}}>
        <Space direction='horizontal'>
          <Button onClick={readClipboardUrl}>从剪贴板读取</Button>
          <Button type='primary' onClick={readChromeUrl}>
            从 Google Chrome 读取
          </Button>
        </Space>
      </div>

      <Row gutter={8} style={{marginTop: 24}}>
        <Col {...layout[0]}>类型</Col>
        <Col {...layout[1]}>URL</Col>
        <Col {...layout[2]}>Target</Col>
      </Row>

      <Row gutter={8}>
        <Col {...layout[0]}>
          <Select value={type} onChange={(val) => setType(val)} style={{width: '100%'}}>
            {TYPES.map((t) => (
              <Option key={t} value={t}>
                {t}
              </Option>
            ))}
          </Select>
        </Col>

        <Col {...layout[1]}>
          <AutoComplete value={url} onChange={setUrl} style={{width: '100%'}}>
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
          <AutoComplete value={target} onChange={setTarget} style={{width: '100%'}}>
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
    </Modal>
  )
}

import pify from 'promise.ify'
import AppleScript from 'applescript'

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

global.URI = URI

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
