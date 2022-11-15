/**
 * auto update
 */

import { runGenerate } from '$ui/commands/run'
import { RuleItem } from '$ui/common/define'
import { debounce, DebouncedFunc, once } from 'lodash'
import ms from 'ms'
import { currentConfigUsingAndEnabled } from '../current-config/model'
import { state, updateRemote } from './model'

const timerRegistry: Record<string, NodeJS.Timer | undefined> = {}
const cleanupTimer = (timerKey: string) => {
  if (timerRegistry[timerKey]) {
    clearInterval(timerRegistry[timerKey])
    delete timerRegistry[timerKey]
  }
}

export const scheduleAutoUpdateOnce = once(scheduleAutoUpdate)

export async function scheduleAutoUpdate() {
  for (const item of state.list) {
    restartAutoUpdate(item, true)
  }
}

export async function stopAutoUpdate(item: RuleItem) {
  cleanupTimer(item.id)
}

// 循环引用, runGenerate 不能立刻引用
let fn: DebouncedFunc<typeof runGenerate>
function runGenerateDebounced() {
  if (!fn) fn = debounce(runGenerate, ms('30s'))
  fn()
}

export async function restartAutoUpdate(item: RuleItem, runImmediate = false) {
  if (item.type === 'local') return

  const { id, autoUpdate, autoUpdateInterval, updatedAt: lastUpdated } = item
  const timerKey = id

  if (!autoUpdate || !autoUpdateInterval) {
    cleanupTimer(timerKey)
    return
  }

  const interval = ms(autoUpdateInterval + 'h')

  // 启动时更新
  // 使用场景: 定时12小时更新, 退出了, 第二天打开自动更新, 但当天重启不会更新
  if (runImmediate) {
    if (!lastUpdated || Date.now() >= lastUpdated + interval) {
      if (currentConfigUsingAndEnabled(item)) {
        await updateRemote({ item, forceUpdate: true })
        await runGenerate()
      }
    }
  }

  cleanupTimer(timerKey)
  timerRegistry[timerKey] = setInterval(async () => {
    if (currentConfigUsingAndEnabled(item)) {
      await updateRemote({ item, forceUpdate: true })
      runGenerateDebounced()
    }
  }, interval)
}
