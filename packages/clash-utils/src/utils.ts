// import { createHash } from 'crypto'
import CryptoJs from 'crypto-js'
import base64js from 'base64-js'

export const B64 = {
  // encode: (s: string) => Buffer.from(s, 'utf-8').toString('base64'),
  // decode: (s: string) => Buffer.from(s, 'base64').toString('utf-8'),

  encode: (s: string) => base64js.fromByteArray(new TextEncoder().encode(s)),
  decode: (s: string) => new TextDecoder().decode(base64js.toByteArray(s)),
}

export const md5 = (s: string) =>
  // createHash('md5').update(s, 'utf8').digest('hex')
  CryptoJs.MD5(s)

export type Truthy<T> = T extends false | '' | 0 | null | undefined ? never : T // from lodash

// https://stackoverflow.com/questions/47632622/typescript-and-filter-boolean?answertab=trending#tab-top
export function truthy<T>(value: T): value is Truthy<T> {
  return !!value
}

console.log(B64.encode('Hello world'))
console.log(B64.encode('你好'))
