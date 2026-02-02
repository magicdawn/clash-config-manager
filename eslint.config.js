import { fromSxzz } from '@magicdawn/eslint-config'

export default fromSxzz({ unocss: true }, [
  { ignores: ['**/dist/', '**/bundle/', 'bak/'] }, // custom ignore,
]).overrideRules({
  'unocss/order': ['warn', { unoFunctions: ['clsx', 'unoMerge', 'useUnoMerge'] }],
})
