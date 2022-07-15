import { createHash } from 'crypto'

export const B64 = {
  encode: (s: string) => Buffer.from(s, 'utf-8').toString('base64'),
  decode: (s: string) => Buffer.from(s, 'base64').toString('utf-8'),
}

export const md5 = (s: string) => createHash('md5').update(s, 'utf8').digest('hex')

export type Truthy<T> = T extends false | '' | 0 | null | undefined ? never : T // from lodash

// https://stackoverflow.com/questions/47632622/typescript-and-filter-boolean?answertab=trending#tab-top
export function truthy<T>(value: T): value is Truthy<T> {
  return !!value
}
