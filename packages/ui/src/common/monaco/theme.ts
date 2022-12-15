import { monaco } from './setup'

import themelist from 'monaco-themes/themes/themelist.json'
const themeModules = import.meta.glob('monaco-themes-json-dir/**/*.json', { eager: true })
const themeModuleKeys = Object.keys(themeModules)

for (const [name, fileWithoutExt] of Object.entries(themelist)) {
  const themeModuleKey = themeModuleKeys.find((k) => k.endsWith(fileWithoutExt + '.json'))
  if (!themeModuleKey) continue

  const themeData = themeModules[themeModuleKey] as monaco.editor.IStandaloneThemeData
  monaco.editor.defineTheme(name, themeData)
}

export const userDefinedThemes = Object.keys(themelist)

export const builtinThemes: string[] = ['vs', 'vs-dark', 'hc-light', 'hc-black']
