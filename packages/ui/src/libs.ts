// always import-then-export, see https://github.com/electron-vite/vite-plugin-electron-renderer/issues/99
import fsp from 'node:fs/promises'
import * as YAML from 'js-yaml'
export { fsp, YAML }
