/// <reference types="vite/client" />

// styles
import '@icon-park/react/styles/index.css'
import 'antd/dist/antd.css'

// monaco setup
import './common/monaco'

// deps
import {
  AppstoreAddOutlined,
  HeartOutlined,
  PayCircleOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { ConfigProvider, Menu, MenuProps } from 'antd'
import zhCN from 'antd/lib/locale/zh_CN' // 由于 antd 组件的默认文案是英文，所以需要修改为中文
import _ from 'lodash'
import { useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import {
  HashRouter,
  Link,
  RouteObject,
  useLocation,
  useNavigate,
  useRoutes,
} from 'react-router-dom'
import Commands from './commands'
import { showCodeModal } from './common/code/ModalCodeViewer'
import './ipc'
import './page/common'
import CurrentConfig from './page/current-config'
import { setNavigateSingleton } from './page/global-model'
import Home from './page/home'
import { useAddRuleModalFromGlobal } from './page/home/useAddRuleModal'
import LibraryRuleList from './page/library-rule-list'
import LibrarySubscribe from './page/library-subscribe'
import Preference from './page/preference'

const routes = [
  {
    path: '/',
    component: Home,
    title: '主页',
    icon: <HeartOutlined />,
  },
  {
    path: '/library-subscribe',
    component: LibrarySubscribe,
    title: '订阅管理',
    icon: <PayCircleOutlined />,
  },
  {
    path: '/library-rule-list',
    component: LibraryRuleList,
    title: '配置源(Partial Config)',
    icon: <AppstoreAddOutlined />,
  },
  {
    path: '/current-config',
    component: CurrentConfig,
    title: '配置组装(Config Builder)',
    icon: <SettingOutlined />,
  },
  {
    path: '/preference',
    component: Preference,
    title: '偏好设置',
    icon: <UserOutlined />,
  },
]

const usingRoutes: RouteObject[] = routes.map((r) => {
  return {
    path: r.path,
    element: <r.component />,
  }
})

const getKey = (s: string) => _.trimStart(s, '/') || 'home'
const menuItems: MenuProps['items'] = routes.map(({ title, path, icon }) => {
  return {
    key: getKey(path),
    icon,
    label: <Link to={path}>{title}</Link>,
  }
})

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <HashRouter>
        <RouterInner />
      </HashRouter>
    </ConfigProvider>
  )
}

// useLocation() may be used only in the context of a <Router> component.
// 最好, Router 套一层
function RouterInner() {
  // nav tab
  const { pathname } = useLocation()
  const menuKey = useMemo(() => [getKey(pathname)], [pathname])

  // add rule
  const { modal: addRuleModal } = useAddRuleModalFromGlobal()

  // navigate
  const nav = useNavigate()
  setNavigateSingleton(nav)

  // routes match
  const matchedEl = useRoutes(usingRoutes)

  return (
    <>
      <Menu selectedKeys={menuKey} mode='horizontal' items={menuItems} />
      <Commands />
      {addRuleModal}
      {showCodeModal}
      <div>{matchedEl}</div>
    </>
  )
}

declare global {
  interface Window {
    // #app
    app: HTMLDivElement
  }
}

const root = createRoot(window.app)
root.render(<App />)
