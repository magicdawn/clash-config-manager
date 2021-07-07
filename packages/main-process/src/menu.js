'use strict'
const path = require('path')
const fse = require('fs-extra')
const {app, Menu, shell, dialog, BrowserWindow} = require('electron')
const {
  is,
  appMenu,
  aboutMenuItem,
  openUrlMenuItem,
  openNewGitHubIssue,
  debugInfo,
} = require('electron-util')
import storage from '../src/storage/index'
import debugFactory from 'debug'
import {updateMenuItem} from './auto-update/index'

const debug = debugFactory('ccm:menu')

const showPreferences = () => {
  // Show the app's preferences here
}

const helpSubmenu = [
  openUrlMenuItem({
    label: 'Website',
    url: 'https://github.com/magicdawn/clash-config-manager',
  }),
  openUrlMenuItem({
    label: 'Source Code',
    url: 'https://github.com/magicdawn/clash-config-manager',
  }),
  {
    label: 'Report an Issue…',
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

const macosTemplate = (options) => [
  appMenu(
    [
      {
        label: 'Preferences…',
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
  {
    role: 'viewMenu',
  },
  {
    role: 'editMenu',
  },
  {
    role: 'windowMenu',
  },
  {
    role: 'help',
    submenu: helpSubmenu,
  },
]

// Linux and Windows
const otherTemplate = () => [
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
]

async function installCli() {
  // contents/resources/app.asar/main/index.js
  const appContents = path.join(__dirname, '../../../')
  const shFile = path.join(appContents, 'Resources/clash-config-manager.sh')
  const linkSources = [`/usr/local/bin/clash-config-mamager`, `/usr/local/bin/ccm`]
  for (let s of linkSources) {
    debug('symlink %s -> %s', s, shFile)
    await fse.remove(s)
    await fse.ensureSymlink(shFile, s)
  }

  debug('installCli success')
  dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
    message: '安装成功',
  })
}

export default async function setMenu() {
  await app.whenReady()
  const template = process.platform === 'darwin' ? macosTemplate : otherTemplate
  const menu = Menu.buildFromTemplate(template({updateMenuItem}))
  Menu.setApplicationMenu(menu)
}
