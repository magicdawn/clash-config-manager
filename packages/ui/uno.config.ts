import { defineConfig, presetWind4, transformerDirectives, transformerVariantGroup } from 'unocss'

export default defineConfig({
  transformers: [transformerDirectives(), transformerVariantGroup()],

  presets: [
    presetWind4({
      preflights: { reset: false, theme: { mode: 'on-demand' } },
      dark: { dark: '.bilibili-gate-using-dark' },
    }),
  ],

  // https://github.com/unocss/unocss/issues/1620
  blocklist: ['container'],

  theme: {
    colors: {},
  },

  shortcuts: {
    'flex-v-center': 'flex items-center',
    'flex-center': 'flex items-center justify-center',
    'inline-flex-center': 'inline-flex items-center justify-center',
  },
})
