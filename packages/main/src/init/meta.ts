import path from 'node:path'
import { app } from 'electron'
import { bundleId, name } from '../../../../package.json'

const prod = process.env.NODE_ENV === 'production'

// Note: Must match `build.appId` in package.json
app.setAppUserModelId(bundleId)

// userData
const appDataPath = app.getPath('appData')
const userDataPath = path.join(appDataPath, prod ? name : name)
app.setPath('userData', userDataPath)
