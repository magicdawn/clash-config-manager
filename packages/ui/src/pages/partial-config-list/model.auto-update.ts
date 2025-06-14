/**
 * auto update
 */

import { debounce, once, type DebouncedFunction } from 'es-toolkit'
import ms from 'ms'
import { runGenerate } from '$ui/modules/commands/run'
import type { RuleItem } from '$ui/types'
import { currentConfigUsingAndEnabled } from '../current-config/model'
import { state, updateRemote } from './model'

const timerRegistry: Record<string, NodeJS.Timeout | undefined> = {}
const cleanupTimer = (timerKey: string) => {
  if (timerRegistry[timerKey]) {
    clearInterval(timerRegistry[timerKey])
    delete timerRegistry[timerKey]
  }
}

// fixme
;(global as any).ruleListTimerRegistry = timerRegistry

export const scheduleAutoUpdate = once(schedule)

function schedule() {
  for (const item of state.list) {
    restartAutoUpdate(item, true)
  }
}

export function stopAutoUpdate(item: RuleItem) {
  cleanupTimer(item.id)
}

// 循环引用, runGenerate 不能立刻引用
let fn: DebouncedFunction<typeof runGenerate>
function runGenerateDebounced() {
  if (!fn) fn = debounce(runGenerate, ms('30s'))
  fn()
}

export async function restartAutoUpdate(item: RuleItem, runImmediate = false) {
  if (item.type === 'local') return

  const { id, autoUpdate, autoUpdateInterval, updatedAt: lastUpdated } = item
  const timerKey = id

  // autoUpdate not enabled
  if (!autoUpdate || !autoUpdateInterval) {
    return cleanupTimer(timerKey)
  }

  const interval = ms(`${autoUpdateInterval}h`)

  // 启动时更新
  // 使用场景: 定时12小时更新, 退出了, 第二天打开自动更新, 但当天重启不会更新
  if (runImmediate && (!lastUpdated || Date.now() >= lastUpdated + interval) && currentConfigUsingAndEnabled(item)) {
    await updateRemote({ item, forceUpdate: true })
    await runGenerate()
  }

  cleanupTimer(timerKey)
  timerRegistry[timerKey] = setInterval(async () => {
    if (currentConfigUsingAndEnabled(item)) {
      await updateRemote({ item, forceUpdate: true })
      runGenerateDebounced()
    }
  }, interval)
}
