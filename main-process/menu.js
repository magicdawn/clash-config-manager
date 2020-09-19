'use strict'
const path = require('path')
const {app, Menu, shell} = require('electron')
const {
  is,
  appMenu,
  aboutMenuItem,
  openUrlMenuItem,
  openNewGitHubIssue,
  debugInfo,
} = require('electron-util')
import storage from '../src/storage/index'

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

const macosTemplate = [
  appMenu([
    {
      label: 'Preferences…',
      accelerator: 'Command+,',
      click() {
        showPreferences()
      },
    },
  ]),
  {
    label: '文件',
    submenu: [
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
    ],
  },
  {
    role: 'viewMenu',
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
const otherTemplate = [
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

const template = process.platform === 'darwin' ? macosTemplate : otherTemplate

export default Menu.buildFromTemplate(template)
