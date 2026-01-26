import path from 'node:path'
import { app, Menu, shell, type MenuItemConstructorOptions } from 'electron'
import { is, openNewGitHubIssue, openUrlMenuItem } from 'electron-util'
import { aboutMenuItem, appMenu, debugInfo } from 'electron-util/main'
import { mainWindow } from '$main/main-window'
import { updateMenuItem } from './auto-update'

const showPreferences = () => {
  // Show the app's preferences here
}

function getIssueBody() {
  return `
<!-- Please succinctly describe your issue and steps to reproduce it. -->

---
${debugInfo()}`
}

const helpSubmenu = [
  openUrlMenuItem({
    label: 'GitHub 项目主页',
    url: 'https://github.com/magicdawn/clash-config-manager',
  }),
  {
    label: '报告 Issue',
    url: 'https://github.com/magicdawn/clash-config-manager/issues',
    click() {
      openNewGitHubIssue({ user: 'magicdawn', repo: 'clash-config-manager', body: getIssueBody() })
    },
  },
]

if (!is.macos) {
  helpSubmenu.push(
    { type: 'separator' },
    aboutMenuItem({
      icon: path.join(import.meta.dirname, 'static', 'icon.png'),
      text: 'Created by Your Name',
    }),
  )
}

const macosTemplate = (options: { updateMenuItem: any }) =>
  [
    appMenu(
      [
        {
          label: '偏好设置',
          accelerator: 'Command+,',
          click() {
            showPreferences()
          },
        },
        options.updateMenuItem,
        { type: 'separator' },
        {
          label: '在 Finder 中打开数据目录',
          click() {
            const dir = app.getPath('userData')
            console.log('userData', dir)
            shell.showItemInFolder(dir)
          },
        },
        {
          label: '在 Finder 中打开数据文件',
          click() {
            mainWindow?.webContents.send('open-electron-store-file')
          },
        },
      ].filter(Boolean),
    ),
    { role: 'fileMenu' },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'help', label: '帮助', submenu: helpSubmenu },
  ] as MenuItemConstructorOptions[]

// Linux and Windows
const otherTemplate = () =>
  [
    {
      role: 'fileMenu',
      submenu: [
        { label: 'Custom' },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'Control+,',
          click() {
            showPreferences()
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'help', submenu: helpSubmenu },
  ] as MenuItemConstructorOptions[]

export default async function setMenu() {
  await app.whenReady()
  const template = process.platform === 'darwin' ? macosTemplate : otherTemplate
  const menu = Menu.buildFromTemplate(template({ updateMenuItem }))
  Menu.setApplicationMenu(menu)
}
