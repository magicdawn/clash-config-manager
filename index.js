const path = require('path')
const {app, BrowserWindow, Menu} = require('electron')
/// const {autoUpdater} = require('electron-updater');
const {is} = require('electron-util')
const unhandled = require('electron-unhandled')
const debug = require('electron-debug')
const contextMenu = require('electron-context-menu')
const config = require('./config')
const menu = require('./menu')
const os = require('os')
const {load: loadDevExt} = require('./main-process/dev/ext')

unhandled()
debug()
contextMenu()

// Note: Must match `build.appId` in package.json
app.setAppUserModelId('com.company.AppName')

// Uncomment this before publishing your first version.
// It's commented out as it throws an error if there are no published versions.
// if (!is.development) {
// 	const FOUR_HOURS = 1000 * 60 * 60 * 4;
// 	setInterval(() => {
// 		autoUpdater.checkForUpdates();
// 	}, FOUR_HOURS);
//
// 	autoUpdater.checkForUpdates();
// }

// Prevent window from being garbage collected
let mainWindow

const createMainWindow = async () => {
  const win = new BrowserWindow({
    title: app.name,
    show: false,
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
    },
  })

  win.on('ready-to-show', () => {
    win.show()
  })

  win.on('closed', () => {
    // Dereference the window
    // For multiple windows store them in an array
    mainWindow = undefined
  })

  if (process.env.NODE_ENV === 'production') {
    console.log('__dirname = %s', __dirname)
    console.log('__filename = %s', __filename)
    console.log('resolve filename = %s', path.resolve(__dirname))

    await win.loadFile(path.join(__dirname, '../renderer/index.html'))
  } else {
    await win.loadURL('http://localhost:7749', {
      userAgent: 'electron',
    })
  }

  return win
}

// Prevent multiple instances of the app
if (!app.requestSingleInstanceLock()) {
  app.quit()
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }

    mainWindow.show()
  }
})

app.on('window-all-closed', () => {
  if (!is.macos) {
    app.quit()
  }
})

app.on('activate', async () => {
  if (!mainWindow) {
    mainWindow = await createMainWindow()
  }
})

//
// engine: start
//
;(async () => {
  await app.whenReady()
  Menu.setApplicationMenu(menu)
  loadDevExt()
  mainWindow = await createMainWindow()

  // const favoriteAnimal = config.get('favoriteAnimal')
  // mainWindow.webContents.executeJavaScript(
  //   `document.querySelector('header p').textContent = 'Your favorite animal is ${favoriteAnimal}'`
  // )
})()
