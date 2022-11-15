/**
 * auto update
 */

import { runCommand } from '$ui/commands/run'
import { Subscribe } from '$ui/common/define'
import { once } from 'lodash'
import ms from 'ms'
import { currentConfigUsingAndEnabled } from '../current-config/model'
import { state, update } from './model'

const timerRegistry: Record<string, NodeJS.Timer | undefined> = {}
const cleanupTimer = (timerKey: string) => {
  if (timerRegistry[timerKey]) {
    clearInterval(timerRegistry[timerKey])
    delete timerRegistry[timerKey]
  }
}

export const scheduleAutoUpdateOnce = once(scheduleAutoUpdate)

export async function scheduleAutoUpdate() {
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
      url,
      forceUpdate: true,
      successMsg: `自动更新订阅: ${name} 更新成功`,
    })

    await runCommand('generate')
  }

  const interval = ms(autoUpdateInterval + 'h')

  // 启动时更新
  // 使用场景: 定时12小时更新, 退出了, 第二天打开自动更新, 但当天重启不会更新
  if (runImmediate) {
    if (!lastUpdated || Date.now() >= lastUpdated + interval) {
      await run()
    }
  }

  cleanupTimer(timerKey)
  timerRegistry[timerKey] = setInterval(async () => {
    await run()
  }, interval)
}
