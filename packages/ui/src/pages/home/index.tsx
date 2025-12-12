import { Button } from 'antd'
import { useCallback } from 'react'
import { runGenerate, runGenerateForceUpdate } from '$ui/modules/commands/run'
import { ConfigForUseSystemProxy } from '../preference/fragments'
import styles from './index.module.less'
import { addRuleModalActions } from './useAddRuleModal'

export default function Home() {
  const generate = useCallback(() => {
    runGenerate()
  }, [])

  const generateForceUpdate = useCallback(() => {
    runGenerateForceUpdate()
  }, [])

  return (
    <div className={styles.page}>
      <h1 className='pl-20px flex items-center justify-between'>
        快捷操作
        <ConfigForUseSystemProxy />
      </h1>
      <div className={styles.btnGenWrapper} style={{ padding: 20 }}>
        <Button type='default' shape='round' className={styles.btnGenForceUpdate} onClick={generateForceUpdate} block>
          更新订阅并重新生成配置
        </Button>

        <Button type='primary' shape='round' className={styles.btnGen} onClick={generate} block>
          重新生成配置
        </Button>

        <Button type='default' shape='round' className={styles.btnAddRule} onClick={addRuleModalActions.open} block>
          快捷添加规则
        </Button>
      </div>
    </div>
  )
}
