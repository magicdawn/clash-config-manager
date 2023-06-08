import 'jake'
import { sh } from './util'

desc('同 `gulp -T`')
task('default', () => {
  sh('jake -t', { silent: true })
})

import { release } from './release'
desc('发布 release')
task('release', release)

import { releaseChangelog } from './release'
namespace('release', () => {
  desc('发布 release: changelog')
  task('changelog', releaseChangelog)
})
