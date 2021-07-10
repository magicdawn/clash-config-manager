import {app} from 'electron'
import path from 'path'
import pkg from '../../package.json'

const prod = process.env.NODE_ENV === 'production'

// Note: Must match `build.appId` in package.json
app.setAppUserModelId(pkg.bundleId)

// userData
const appDataPath = app.getPath('appData')
const userDataPath = path.join(appDataPath, prod ? pkg.name : pkg.name)
app.setPath('userData', userDataPath)
