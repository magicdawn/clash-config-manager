import React, {useState, useCallback, useEffect, useRef} from 'react'
import {Button, DatePicker, version, Layout, Menu, Modal, Input, message} from 'antd'
import {MailOutlined, AppstoreOutlined, SettingOutlined} from '@ant-design/icons'
import {useMount, usePersistFn, useUpdateEffect, useSetState} from 'ahooks'
import {compose} from 'recompose'
import usePlug from '@x/rematch/usePlug'
import {v4 as uuid} from 'uuid'
import {firstLine} from '../../util/text-util'

import styles from './index.module.less'
import storage from '../../storage/index'
import {List, Typography, Divider, Space, Form, Checkbox, Select} from 'antd'
import DndPlaygroud from './DndPlayground'

const {Header, Footer, Sider, Content} = Layout
const {SubMenu} = Menu
const {Option} = Select

const namespace = 'currentConfig'

export default function ConfigList(props) {
  const {effects, state, setState} = usePlug({
    nsp: namespace,
    state: ['config'],
  })

  useMount(() => {
    effects.init()
  })

  return (
    <div className={styles.page}>
      <h1>配置管理</h1>
      <DndPlaygroud></DndPlaygroud>
    </div>
  )
}
