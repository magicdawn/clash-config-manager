/// <reference types="vite/client" />

// styles
import '@icon-park/react/styles/index.css'
import 'antd/dist/reset.css'
import 'virtual:uno.css'
import './common/global.less'

// monaco setup
import './modules/code-editor/monaco'
// deps
import '@total-typescript/ts-reset'
import './ipc'
import { trimStart } from 'es-toolkit'
import { createRoot } from 'react-dom/client'
import { createHashRouter, createRoutesFromElements, Link, Route } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import MaterialSymbolsSettingsSuggestRounded from '~icons/material-symbols/settings-suggest-rounded'
import MingcuteComponentsFill from '~icons/mingcute/components-fill'
import MingcuteHome4Line from '~icons/mingcute/home-4-line'
import TablerCloudUp from '~icons/tabler/cloud-up'
import ZondiconsServers from '~icons/zondicons/servers'
import { RootLayout } from './pages/_layout/RootLayout'
import CurrentConfig from './pages/current-config'
import Home from './pages/home'
import LibraryRuleList from './pages/partial-config-list'
import Preference from './pages/preference'
import LibrarySubscribe from './pages/subscribe-list'
import { routeTitles } from './storage'
import type { MenuProps } from 'antd'

const routes = [
  {
    path: '/',
    component: Home,
    title: '主页',
    icon: <MingcuteHome4Line className='size-18px' />,
  },
  {
    path: '/subscribe-list',
    component: LibrarySubscribe,
    title: '',
    icon: <ZondiconsServers className='size-14px' />,
  },
  {
    path: '/partial-config-list',
    component: LibraryRuleList,
    title: '',
    icon: <MingcuteComponentsFill className='size-18px' />,
  },
  {
    path: '/current-config',
    component: CurrentConfig,
    title: '',
    icon: <MaterialSymbolsSettingsSuggestRounded className='size-18px' />,
  },
  {
    path: '/preference',
    component: Preference,
    title: '',
    icon: <TablerCloudUp className='size-18px' />,
  },
]
routes.forEach((r) => {
  r.title ||= routeTitles[r.path.slice(1) as keyof typeof routeTitles]
})

const getKey = (s: string) => trimStart(s, '/') || 'home'
const menuItems: MenuProps['items'] = routes.map(({ title, path, icon }) => {
  return {
    key: getKey(path),
    icon,
    label: <Link to={path}>{title}</Link>,
  }
})

const router = createHashRouter(
  createRoutesFromElements(
    <Route path='/' element={<RootLayout {...{ menuItems, getKey }} />}>
      {routes.map((r) => (
        <Route key={r.path} path={r.path} Component={r.component} />
      ))}
    </Route>,
  ),
)

function App() {
  return <RouterProvider router={router} />
}

const root = createRoot(document.getElementById('app')!)
root.render(<App />)
