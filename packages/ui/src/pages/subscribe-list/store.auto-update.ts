/**
 * auto update
 */

import { once } from 'es-toolkit'
import ms from 'ms'
import { runGenerate } from '$ui/modules/commands/run'
import { currentConfigUsingAndEnabled } from '../current-config/model'
import { state, update } from './store'
import type { Subscribe } from '$ui/types'

const timerRegistry: Record<string, NodeJS.Timeout | undefined> = {}
const cleanupTimer = (timerKey: string) => {
  if (timerRegistry[timerKey]) {
    clearInterval(timerRegistry[timerKey])
    delete timerRegistry[timerKey]
  }
}

// fixme
;(global as any).subscribeTimerRegistry = timerRegistry

export const scheduleAutoUpdate = once(schedule)

function schedule() {
  for (const sub of state.list) {
    restartAutoUpdate(sub, true)
  }
}

export function stopAutoUpdate(id: string) {
  cleanupTimer(id)
}

export async function restartAutoUpdate(item: Subscribe, runImmediate = false) {
  const { id, name, url, autoUpdate, autoUpdateInterval, updatedAt: lastUpdated } = item
  const timerKey = id
  if (!autoUpdate || !autoUpdateInterval) {
    cleanupTimer(timerKey)
    return
  }

  const run = async () => {
    if (!currentConfigUsingAndEnabled(item)) return

    await update({
      idOrUrl: url,
      forceUpdate: true,
      successMsg: `自动更新订阅: ${name} 更新成功`,
    })

    await runGenerate()
  }

  const interval = ms(`${autoUpdateInterval}h`)

  // 启动时更新
  // 使用场景: 定时12小时更新, 退出了, 第二天打开自动更新, 但当天重启不会更新
  if (runImmediate && (!lastUpdated || Date.now() >= lastUpdated + interval)) {
    await run()
  }

  cleanupTimer(timerKey)
  timerRegistry[timerKey] = setInterval(async () => {
    await run()
  }, interval)
}
