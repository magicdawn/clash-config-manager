/// <reference types="vite/client" />

import {
  AppstoreAddOutlined,
  HeartOutlined,
  PayCircleOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons'
// styles
import '@icon-park/react/styles/index.css'
import type { MenuProps } from 'antd'
import { ConfigProvider, Menu } from 'antd'
import 'antd/dist/antd.css'
import zhCN from 'antd/lib/locale/zh_CN' // 由于 antd 组件的默认文案是英文，所以需要修改为中文
import _ from 'lodash'
import React, { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { renderRoutes } from 'react-router-config'
import { HashRouter as Router, Link, useLocation } from 'react-router-dom'
import Commands from './commands'
import './page/common'
import CurrentConfig from './page/current-config'
import Home from './page/home'
import LibraryRuleList from './page/library-rule-list'
import LibrarySubscribe from './page/library-subscribe'
import Preference from './page/preference'

const routes = [
  {
    path: '/',
    exact: true,
    component: Home,
    title: '主页',
    icon: <HeartOutlined />,
  },
  {
    path: '/library/subscribe',
    exact: true,
    component: LibrarySubscribe,
    title: '订阅管理',
    icon: <PayCircleOutlined />,
  },
  {
    path: '/library/rule-list',
    exact: true,
    component: LibraryRuleList,
    title: '配置源管理',
    icon: <AppstoreAddOutlined />,
  },
  {
    path: '/current-config',
    exact: true,
    component: CurrentConfig,
    title: '配置管理',
    icon: <SettingOutlined />,
  },
  {
    path: '/preference',
    exact: true,
    component: Preference,
    title: '偏好设置',
    icon: <UserOutlined />,
  },
]

function Root() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Routes></Routes>
      </Router>
    </ConfigProvider>
  )
}

function Routes() {
  const { pathname } = useLocation()
  const getKey = (s: string) => _.trimStart(s, '/').replace(/\//g, ':') || 'home'
  const menuKey = getKey(pathname)

  useEffect(() => {
    ;(window as any).gtag?.('event', 'page_view', {
      // eslint-disable-next-line camelcase
      page_path: pathname,
    })
  }, [pathname])

  const menuItems: MenuProps['items'] = routes.map(({ title, path, icon }) => {
    return { label: <Link to={path}>{title}</Link>, key: getKey(path), icon }
  })

  return (
    <>
      <Menu selectedKeys={[menuKey]} mode='horizontal' items={menuItems} />
      <Commands />
      <div>{renderRoutes(routes)}</div>
    </>
  )
}

declare global {
  interface Window {
    // #app
    app: HTMLDivElement
  }
}

// render(<Root />, window.app)
createRoot(window.app).render(<Root />)
