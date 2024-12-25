import * as remote from '@electron/remote'
import { ipcRenderer } from 'electron'
import envPaths from 'env-paths'
import pMemoize from 'p-memoize'

export const APP_NAME = 'clash-config-manager'

/**
 * dirs this app will use
 */

// ~/Library/Application Support/clash-config-manager
export const userDataPath = remote.app.getPath('userData')

export const appEnvPaths = envPaths(APP_NAME, { suffix: '' })

// ~/Library/Caches/clash-config-manager
export const appCacheDir = appEnvPaths.cache

// $TMPDIR/clash-config-manager
export const appTempDir = appEnvPaths.temp

// bundled assets
export const getAssetsDir = pMemoize(async () => {
  return await ipcRenderer.invoke('getAssetsDir')
})

export const __DEV__ = import.meta.env.DEV
export const __PROD__ = import.meta.env.PROD

export const colorHighlightIdentifier = '--hightlight-color'
export const colorHighlightValue = `var(${colorHighlightIdentifier})`
export const colorHighlightHex = `#01847F` // 马尔斯绿
