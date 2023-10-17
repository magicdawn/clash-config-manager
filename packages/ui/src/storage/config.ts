import { type StorageData } from './index'

export const keysToOmit = [
  'subscribe_detail' as const,
  'subscribe_status' as const,
] satisfies (keyof StorageData)[]
