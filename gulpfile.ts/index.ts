import { execSync } from 'child_process'
import { TaskFunction } from 'gulp'

const defaultTask: TaskFunction = async function () {
  execSync('gulp -T', { stdio: 'inherit' })
}
defaultTask.description = '同 `gulp -T`'
export default defaultTask

export { release } from './release'
