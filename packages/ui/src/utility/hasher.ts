import { createHash } from 'node:crypto'

function hashFnFactory(hashName: string) {
  return (s: string) => createHash(hashName).update(s, 'utf8').digest('hex')
}

export const md5 = hashFnFactory('md5')
export const sha1 = hashFnFactory('sha1')
export const sha256 = hashFnFactory('sha256')
