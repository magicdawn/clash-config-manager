import React, {useCallback} from 'react'
import {Button} from 'antd'
import {runCommand} from '@commands/run'
import styles from './index.module.less'

export default function Home() {
  const generate = useCallback(() => {
    runCommand('generate')
  }, [])

  return (
    <div className={styles.page}>
      <h1>Enjoy</h1>
      <div className={styles.btnGenWrapper} style={{padding: 20}}>
        <Button type='primary' shape='round' className={styles.btnGen} onClick={generate} block>
          重新生成配置文件
        </Button>
      </div>
    </div>
  )
}
