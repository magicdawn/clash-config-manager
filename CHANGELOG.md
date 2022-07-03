# Changelog

## v0.10.0 未发布

- [x] 重构: 移除 easy-peasy / redux, 使用 valtio 作为全局状态管理
- [x] 重构: 移除 rxjs BehaviorSubject / recompose 等, 使用 valtio 全局组件
- [x] 重构: 开启 TypeScript strictNullChecks

## v0.9.0 2022-07-02

- [x] yarn -> pnpm
- [x] poi -> rollup / vite, 原因是 poi 对 ts 支持有限
- [x] increase AddRuleModal target length limit, from 10000 to 200000
- [x] clean up deps, use react@18
- [x] 订阅管理增加排除关键词支持, (excludeKeywords), 可以按节点名字匹配关键词忽略特定节点

## v0.8.0

- 支持 `ssr://` 协议配置到 clash

## v0.7.0

- it's broken for electron-updater@latest, it's using `fs/promises` module, so upgrade
- electron -> v16
- electron-builder -> latest
- electron-store -> latest
- use `@electron/remote`

## v0.6.1

- chore: update `electron-*` especially electron-updater, because auto update is broken now(v0.6 / v0.5)

## v0.6.0

- clash vmess `ws-path` / `ws-headers`, 变成 `ws-opts.path` / `ws-opts.headers` 更改

## v0.5.2

- fix build

## v0.5.1

- fix 由于 monorepo 导致 meta userData 目录不正确的问题.

## v0.5.0

- monorepo
- 首页 icon size 调整
- auto-update 增加 catch

## v0.4.0

- TypeScript 重构前端部分
- 使用 easy-peasy 代替 reamtch
- 配置生成区分 `forceUpdate` 和 普通生成
- 主页添加生成按钮和快速添加规则按钮

## v0.3.1

- 修复由于订阅中包含 ss/ssr 服务导致的生成错误. 目前是只保留 `vmess://` 服务.

## v0.3.0 2020-10-11

- 使用 react-router-config
- 修复选择导出 modal 关不掉的问题. (rxjs BehaviorSubject 状态同步问题)
- 修复导入取消报错问题.
- 更新内置的基础数据规则. 新增自定义规则模板

## v0.2.3 2020-10-05

- 修复自动更新, 使用菜单显示, 修复 quitAndInstall
- 使用 CCM_RUN_MODE = cli 使用 cli, 去除 yargs

## v0.2.2 2020-10-03

- try to enable auto-update

## v0.2.1 2020-10-03

- fix 刚开始启动时使用 command palette, generate 出错的问题.

## v0.2.0 2020-10-02

- fix #1, 消息遮挡操作问题
- add `code` like cli (因 yargs 不能使用 webpack 打包, 现在不起作用)
- 添加 command palette
- 添加吃豆人(pacman) loading

## v0.1.2 2020-09-26

- fix can not quit problem

## v0.1.1 2020-09-26

- fix some style issue
- fix window restore problem, fix window getBounds problem

## v0.1.0 2020-09-22

- embed preset config
- support partial export

## v0.0.8 2020-09-22

- fix urlToSubscribe use ua `electron`, as the App name includes `clash`, the prod UA includes the app name

## v0.0.7 2020-09-19

- support remote config file

## v0.0.6 2020-09-19

- 适配 clash core 1.0, see https://github.com/Dreamacro/clash/wiki/breaking-changes-in-1.0.0

## v0.0.5 2020-09-19

- fix error can not find command `atom` / `code`

## v0.0.4 2020-09-19

- [x] 快速添加规则, mc clash add-rule GUI version
- [x] 记住窗口位置
- [x] 导入导出(store 加密有必要, 防止扫描)
- [ ] 备份不处理详情. (no need)
- [x] 在 vscode/Atom 中编辑规则

## v0.0.3 2020-09-19

- fix dmg icon
- feat add rule
- etc...

## v0.0.2 2020-09-18

- add icons & make modals centered, etc UI modifications.

## v0.0.1 uknown date

the usable version
