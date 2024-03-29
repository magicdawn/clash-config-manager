/// <reference types="vite/client" />

// styles
import '@icon-park/react/styles/index.css'
import 'antd/dist/reset.css'
import './index.less'

// monaco setup
import './modules/code-editor/monaco'

// deps
import {
  AppstoreAddOutlined,
  HeartOutlined,
  PayCircleOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons'
import '@total-typescript/ts-reset'
import { App as AntdApp, ConfigProvider, Menu, MenuProps, theme } from 'antd'
import zhCN from 'antd/lib/locale/zh_CN' // 由于 antd 组件的默认文案是英文，所以需要修改为中文
import _ from 'lodash'
import { useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Link,
  Outlet,
  Route,
  RouterProvider,
  createHashRouter,
  createRoutesFromElements,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import styles from './index.module.less'
import './ipc'
import { showCodeModal } from './modules/code-editor/ModalCodeViewer'
import Commands from './modules/commands'
import './modules/common'
import CurrentConfig from './modules/current-config'
import { setNavigateSingleton } from './modules/global-model'
import Home from './modules/home'
import { useAddRuleModalFromGlobal } from './modules/home/useAddRuleModal'
import LibraryRuleList from './modules/library-rule-list'
import LibrarySubscribe from './modules/library-subscribe'
import Preference from './modules/preference'
import { routeTitles } from './storage'
import { SetupAntdStatic, messageConfig } from './store'
import { useIsDarkMode } from './utility/hooks/useIsDarkMode'

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
    title: '',
    icon: <PayCircleOutlined />,
  },
  {
    path: '/library-rule-list',
    component: LibraryRuleList,
    title: '',
    icon: <AppstoreAddOutlined />,
  },
  {
    path: '/current-config',
    component: CurrentConfig,
    title: '',
    icon: <SettingOutlined />,
  },
  {
    path: '/preference',
    component: Preference,
    title: '',
    icon: <UserOutlined />,
  },
]
routes.forEach((r) => {
  r.title ||= routeTitles[r.path.slice(1)]
})

const getKey = (s: string) => _.trimStart(s, '/') || 'home'
const menuItems: MenuProps['items'] = routes.map(({ title, path, icon }) => {
  return {
    key: getKey(path),
    icon,
    label: <Link to={path}>{title}</Link>,
  }
})

const router = createHashRouter(
  createRoutesFromElements(
    <Route path='/' Component={RootLayout}>
      {routes.map((r) => (
        <Route key={r.path} path={r.path} Component={r.component} />
      ))}
    </Route>,
  ),
)

function App() {
  return <RouterProvider router={router} />
}

function RootLayout() {
  const isDark = useIsDarkMode()
  const algorithm = isDark ? theme.darkAlgorithm : theme.defaultAlgorithm

  // nav tab
  const { pathname } = useLocation()
  const menuKey = useMemo(() => [getKey(pathname)], [pathname])

  // add rule
  const { modal: addRuleModal } = useAddRuleModalFromGlobal()

  // navigate
  const nav = useNavigate()
  setNavigateSingleton(nav)

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        cssVar: true,
        algorithm,
      }}
    >
      <AntdApp message={messageConfig}>
        <SetupAntdStatic />

        <Menu
          selectedKeys={menuKey}
          mode='horizontal'
          items={menuItems}
          className={styles.navMenu}
        />

        <Commands />

        {addRuleModal}
        {showCodeModal}

        {/* render routes */}
        <Outlet />
      </AntdApp>
    </ConfigProvider>
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
