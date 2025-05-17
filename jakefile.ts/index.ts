import { release, releaseChangelog } from './release'
import { sh } from './util'

import 'jake'

desc('同 `gulp -T`')
task('default', () => {
  sh('jake -t', { silent: true })
})
desc('发布 release')
task('release', release)

namespace('release', () => {
  desc('发布 release: changelog')
  task('changelog', releaseChangelog)
})
