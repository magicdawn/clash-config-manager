/* eslint-disable require-await */

import { tipc } from '@egoist/tipc/main'
import { Brave, Chrome } from 'mac-helper'

const t = tipc.create()

export const router = t.router({
  sum: t.procedure.input<{ a: number; b: number }>().action(async ({ input }) => {
    return input.a + input.b
  }),

  getRunningBrowserInfo: t.procedure.action(async ({ input }) => {
    const brave = {
      running: await Brave.isRunning(),
      url: (await Brave.getActiveTab())?.url,
    }
    const chrome = {
      running: await Chrome.isRunning(),
      url: (await Chrome.getActiveTab())?.url,
    }
    return { brave, chrome }
  }),
})

export type Router = typeof router
