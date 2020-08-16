import React, {useState, useCallback} from 'react'
import {Button, DatePicker, version, Layout, Menu} from 'antd'
import {MailOutlined, AppstoreOutlined, SettingOutlined} from '@ant-design/icons'
import styles from './index.module.less'

const {Header, Footer, Sider, Content} = Layout
const {SubMenu} = Menu

import {List, Typography, Divider, Space} from 'antd'

const data = [
  'Racing car sprays burning fuel into crowd.',
  'Japanese princess to wed commoner.',
  'Australian walks 100km after outback crash.',
  'Man charged over missing wedding girl.',
  'Los Angeles battles huge wildfires.',
]

export default function LibrarySubscribe() {
  return (
    <div className={styles.page}>
      <h1>订阅管理</h1>

      <List
        size='large'
        header={
          <div>
            <h4>订阅管理</h4>
          </div>
        }
        footer={<div>Footer</div>}
        bordered
        dataSource={data}
        renderItem={(item) => (
          <List.Item style={{display: 'flex'}}>
            {item}
            {/* <br /> */}
            <Space style={{alignSelf: 'flex-end'}}>
              <Button type='primary'>编辑</Button>
              <Button type='primary'>更新</Button>
              <Button type='danger'>删除</Button>
            </Space>
          </List.Item>
        )}
      />
    </div>
  )
}
