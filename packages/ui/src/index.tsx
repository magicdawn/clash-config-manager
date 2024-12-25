/// <reference types="vite/client" />

// styles
import '@icon-park/react/styles/index.css'
import 'antd/dist/reset.css'
import './index.less'
import 'virtual:uno.css'

// monaco setup
import './modules/code-editor/monaco'

// deps
import '@total-typescript/ts-reset'
import { type MenuProps } from 'antd'
import { size } from 'polished'
import { createRoot } from 'react-dom/client'
import {
  Link,
  Route,
  RouterProvider,
  createHashRouter,
  createRoutesFromElements,
} from 'react-router-dom'
import MaterialSymbolsSettingsSuggestRounded from '~icons/material-symbols/settings-suggest-rounded'
import MingcuteComponentsFill from '~icons/mingcute/components-fill'
import MingcuteHome4Line from '~icons/mingcute/home-4-line'
import TablerCloudUp from '~icons/tabler/cloud-up'
import ZondiconsServers from '~icons/zondicons/servers'
import './ipc'
import './modules/common'
import { RootLayout } from './pages/_layout/RootLayout'
import CurrentConfig from './pages/current-config'
import Home from './pages/home'
import LibraryRuleList from './pages/partial-config-list'
import Preference from './pages/preference'
import LibrarySubscribe from './pages/subscribe-list'
import { routeTitles } from './storage'
import { trimStart } from 'es-toolkit'

const routes = [
  {
    path: '/',
    component: Home,
    title: '主页',
    icon: <MingcuteHome4Line {...size(18)} />,
  },
  {
    path: '/subscribe-list',
    component: LibrarySubscribe,
    title: '',
    icon: <ZondiconsServers {...size(14)} />,
  },
  {
    path: '/partial-config-list',
    component: LibraryRuleList,
    title: '',
    icon: <MingcuteComponentsFill {...size(18)} />,
  },
  {
    path: '/current-config',
    component: CurrentConfig,
    title: '',
    icon: <MaterialSymbolsSettingsSuggestRounded {...size(18)} />,
  },
  {
    path: '/preference',
    component: Preference,
    title: '',
    icon: <TablerCloudUp {...size(18)} />,
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
