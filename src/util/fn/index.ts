import {createHash} from 'crypto'
import path from 'path'
import fse from 'fs-extra'
import request from 'umi-request'
import envPaths from 'env-paths'
import moment from 'moment'

const appCacheDir = envPaths('clash-config-manager', {suffix: ''}).cache

const Base64 = {
  encode: (s: string) => Buffer.from(s, 'utf-8').toString('base64'),
  decode: (s: string) => Buffer.from(s, 'base64').toString('utf-8'),
}

const md5 = (s: string) => createHash('md5').update(s, 'utf8').digest('hex')

const readUrl = async ({url, file}: {url: string; file: string}) => {
  const text = (await request.get(url, {
    responseType: 'text',
    headers: {
      'x-extra-headers': JSON.stringify({
        'user-agent': 'electron',
      }),
    },
  })) as string

  fse.outputFile(file, text).then(
    () => {
      console.log('File %s writed', file)
    },
    (e) => {
      console.error(e.stack || e)
    }
  )

  return text
}

const urlToSubscribe = async ({url, force}: {url: string; force: boolean}) => {
  const file = path.join(appCacheDir, 'readUrl', md5(url))

  let shouldReuse = false
  let stat: fse.Stats
  // 今天之内的更新不会再下载
  const isRecent = (mtime: Date) =>
    moment(mtime).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')
  if (!force && fse.existsSync(file) && (stat = fse.statSync(file)) && isRecent(stat.mtime)) {
    shouldReuse = true
  }

  let text: string
  if (shouldReuse) {
    text = fse.readFileSync(file, 'utf8')
  } else {
    text = await readUrl({url, file})
  }

  return textToSubscribe(text)
}

const textToSubscribe = (text: string) => {
  text = Base64.decode(text)
  const rawLines = text.split(/\r?\n/).filter(Boolean)
  const lines = rawLines
    .map((line) => {
      const idx = line.indexOf('://')
      const type = line.slice(0, idx)
      let text = line.slice(idx + '://'.length)
      text = Base64.decode(text)

      let server
      if (type === 'vmess') server = getVmessServer(text)
      // if (type === 'ssr') server = getSsrServer(text)
      if (!server) return

      return {type, server}
    })
    .filter(Boolean)

  return lines
}

const getVmessServer = (str: string) => {
  return JSON.parse(str)
}

const getSsrServer = (str) => {
  // hinet1.puffvip.com:1063:auth_aes128_sha1:chacha20:plain:UGFvZnU/?obfsparam=ZmE3Nzc4NzYzMS5taWNyb3NvZnQuY29t&protoparam=ODc2MzE6eHlqdHlza2Z5ZGhxc3M&remarks=W1YxXSDlj7Dmub4x&group=5rOh6IqZ5LqR

  const [prev, rest] = str.split('/?')
  const [server, port, cipher, password, obfs] = prev.split(':')
  const params = new URLSearchParams(rest)

  // @ts-ignore
  let {obfsparam, protoparam, remarks, group} = Array.from(params).reduce(
    (result, [key, value]) => {
      result[key] = value
      return result
    },
    {}
  )

  if (remarks) remarks = Base64.decode(remarks)
  if (group) group = Base64.decode(group)

  return {server, port, cipher, password, obfs, obfsparam, protoparam, remarks, group}
}

export {Base64, textToSubscribe, urlToSubscribe, getVmessServer, getSsrServer}
