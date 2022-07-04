import path from 'path'
import fse from 'fs-extra'
import { app, Menu, shell, dialog, BrowserWindow, MenuItemConstructorOptions } from 'electron'
import {
  is,
  appMenu,
  aboutMenuItem,
  openUrlMenuItem,
  openNewGitHubIssue,
  debugInfo,
} from 'electron-util'
import storage from '$ui/storage/index'
import debugFactory from 'debug'
import { updateMenuItem } from './auto-update/index'

const debug = debugFactory('ccm:menu')

const showPreferences = () => {
  // Show the app's preferences here
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
      const body = `
<!-- Please succinctly describe your issue and steps to reproduce it. -->

---
${debugInfo()}`

      openNewGitHubIssue({
        user: 'magicdawn',
        repo: 'clash-config-manager',
        body,
      })
    },
  },
]

if (!is.macos) {
  helpSubmenu.push(
    {
      type: 'separator',
    },
    aboutMenuItem({
      icon: path.join(__dirname, 'static', 'icon.png'),
      text: 'Created by Your Name',
    })
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
        ...(process.env.NODE_ENV === 'production'
          ? [
              {
                type: 'separator',
              },
              {
                label: '安装 `clash-config-manager`/ `ccm` 命令',
                click() {
                  installCli()
                },
              },
            ]
          : []),
        {
          type: 'separator',
        },
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
            shell.showItemInFolder(storage.path)
          },
        },
      ].filter(Boolean)
    ),

    // {
    //   role: 'editMenu',
    // },
    {
      label: '编辑',
      submenu: [
        { role: 'selectAll', label: '全选' },
        { role: 'copy', label: '复制' },
        { role: 'cut', label: '剪切' },
        { role: 'paste', label: '粘贴' },
      ],
    },

    // {
    //   role: 'viewMenu',
    // },
    {
      label: '视图',
      submenu: [
        process.env.NODE_ENV === 'development' && { role: 'reload' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
      ].filter(Boolean),
    },

    {
      role: 'help',
      label: '帮助',
      submenu: helpSubmenu,
    },
  ] as MenuItemConstructorOptions[]

// Linux and Windows
const otherTemplate = () =>
  [
    {
      role: 'fileMenu',
      submenu: [
        {
          label: 'Custom',
        },
        {
          type: 'separator',
        },
        {
          label: 'Settings',
          accelerator: 'Control+,',
          click() {
            showPreferences()
          },
        },
        {
          type: 'separator',
        },
        {
          role: 'quit',
        },
      ],
    },
    {
      role: 'editMenu',
    },
    {
      role: 'viewMenu',
    },
    {
      role: 'help',
      submenu: helpSubmenu,
    },
  ] as MenuItemConstructorOptions[]

async function installCli() {
  // contents/resources/app.asar/main/index.js
  const appContents = path.join(__dirname, '../../../')
  const shFile = path.join(appContents, 'Resources/clash-config-manager.sh')
  const linkSources = [`/usr/local/bin/clash-config-mamager`, `/usr/local/bin/ccm`]
  for (const s of linkSources) {
    debug('symlink %s -> %s', s, shFile)
    await fse.remove(s)
    await fse.ensureSymlink(shFile, s)
  }

  debug('installCli success')

  const win = BrowserWindow.getFocusedWindow()
  win &&
    dialog.showMessageBoxSync(win, {
      message: '安装成功',
    })
}

export default async function setMenu() {
  await app.whenReady()
  const template = process.platform === 'darwin' ? macosTemplate : otherTemplate
  const menu = Menu.buildFromTemplate(template({ updateMenuItem }))
  Menu.setApplicationMenu(menu)
}
