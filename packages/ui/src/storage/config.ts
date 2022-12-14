import { type StorageData } from '.'

export const keysToOmit = [
  'subscribe_detail' as const,
  'subscribe_status' as const,
] satisfies (keyof StorageData)[]
