import { runGenerate, runGenerateForceUpdate } from '$ui/modules/commands/run'
import { Button } from 'antd'
import { useCallback } from 'react'
import styles from './index.module.less'
import { addRuleStore } from './useAddRuleModal'

export default function Home() {
  const generate = useCallback(() => {
    runGenerate()
  }, [])

  const generateForceUpdate = useCallback(() => {
    runGenerateForceUpdate()
  }, [])

  const addRule = useCallback(() => {
    addRuleStore.open()
  }, [])

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>快捷操作</h1>
      <div className={styles.btnGenWrapper} style={{ padding: 20 }}>
        <Button
          type='default'
          shape='round'
          className={styles.btnGenForceUpdate}
          onClick={generateForceUpdate}
          block
        >
          更新订阅并重新生成配置
        </Button>

        <Button type='primary' shape='round' className={styles.btnGen} onClick={generate} block>
          重新生成配置
        </Button>

        <Button type='default' shape='round' className={styles.btnAddRule} onClick={addRule} block>
          快捷添加规则
        </Button>
      </div>
    </div>
  )
}
