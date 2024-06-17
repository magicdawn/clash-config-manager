import { css } from '@emotion/react'
import { App as AntdApp, ConfigProvider, Menu, theme, type MenuProps } from 'antd'
import zhCN from 'antd/lib/locale/zh_CN' // 由于 antd 组件的默认文案是英文，所以需要修改为中文
import { useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { showCodeModal } from '../../modules/code-editor/ModalCodeViewer'
import Commands from '../../modules/commands'
import { setNavigateSingleton } from '../../modules/global-model'
import { SetupAntdStatic, messageConfig } from '../../store'
import { useIsDarkMode } from '../../utility/hooks/useIsDarkMode'
import { useAddRuleModalFromGlobal } from '../home/useAddRuleModal'

export function RootLayout({
  menuItems,
  getKey,
}: {
  menuItems: MenuProps['items']
  getKey: (s: string) => string
}) {
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
        <Menu
          selectedKeys={menuKey}
          mode='horizontal'
          items={menuItems}
          css={css`
            &.ant-menu {
              /* --ant-menu-horizontal-line-height: 40px; */
              --ant-menu-icon-margin-inline-end: 5px;
            }
            .ant-menu-item {
              --ant-menu-item-padding-inline: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
          `}
        />

        <Commands />
        {addRuleModal}
        {showCodeModal}
        <SetupAntdStatic />

        {/* render routes */}
        <Outlet />
      </AntdApp>
    </ConfigProvider>
  )
}
