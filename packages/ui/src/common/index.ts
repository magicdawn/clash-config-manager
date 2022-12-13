import * as remote from '@electron/remote'
import envPaths from 'env-paths'

// ~/Library/Application Support/clash-config-manager
export const userDataPath = remote.app.getPath('userData')

// ~/Library/Caches/clash-config-manager
export const cacheDir = envPaths('clash-config-manager', { suffix: '' }).cache
