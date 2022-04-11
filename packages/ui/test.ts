import { resolveConfig } from 'vite'

main()
async function main() {
  const serveConfig = await resolveConfig({}, 'serve')
  const buildConfig = await resolveConfig({}, 'build')

  debugger
  console.log(serveConfig, buildConfig)
}
