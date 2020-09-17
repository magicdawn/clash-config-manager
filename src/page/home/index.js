import React, {useState, useCallback} from 'react'
import {Button, DatePicker, version, Layout, Menu, Steps} from 'antd'
import {MailOutlined, AppstoreOutlined, SettingOutlined} from '@ant-design/icons'

const {Header, Footer, Sider, Content} = Layout
const {SubMenu} = Menu
const {Step} = Steps

export default function Home() {
  return (
    <div className='home'>
      <Steps>
        <Step title='第一步' />
        <Step title='第二步' />
        <Step title='第三步' />
      </Steps>
    </div>
  )
}
