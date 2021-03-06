# clash-config-manager

> a clashX config manager for macOS

## 下载

[**下载 .dmg 文件**](https://github.com/magicdawn/clash-config-manager/releases/latest)

## 功能

- [x] 支持 v2ray 服务器订阅, e.g 手机端 ShadowRocket 的 subscribe
- [x] 支持远程规则 / 支持 clash 规则订阅. (不推荐这种,自定义规则的 target 需要与订阅里的 proxy group 一致, 不方便写自定义规则)
- [x] 支持导入导出数据, webdav 备份数据, 支持合并数据, 支持导出部分数据用于分享
- [x] 支持在应用中编辑规则
- [x] 支持在 vscode/Atom 中编辑规则
- [x] 支持从 剪贴板/Chrome 快速添加规则
- [x] 内置基础配置, 导入内置基础配置 + 添加一个 subscribe 即可开始使用.
- [ ] 支持命令行
- [x] 支持类似 Atom / vscode 的 command palette 快速操作

## 截图

![](https://i.loli.net/2020/09/22/7Xwu3PBRpi6xG1Y.png)
![](https://i.loli.net/2020/09/22/9KHJ5WTEzeFaXsP.png)
![Xnip2020-10-03_02-12-54.png](https://i.loli.net/2020/10/03/ZPn3QraOIKWsuvR.png)

## 概念解释

- 订阅管理: 类似 ShadowRocket 中的订阅, 订阅地址会返回一堆服务器配置
- 配置源管理: clash 配置管理, 每一项都是 clash 配置的一部分. 配置分为本地和远程配置, 有一些订阅会返回 clash 完整的配置文件, 即是远程配置.
- 配置管理: 通过拖拽右侧 "可用订阅" + "可用配置源" 到左侧 "当前配置", 可生成一个最后使用的配置.

## 开始使用

1. 导入基础设置
2. 添加订阅
3. 生成配置, 在 clashX 中选择的 clash-config-manager
4. :rocket:

### 带规则的订阅每次更新导致编辑的自定义规则丢失的问题

1. 添加一个远程规则, 地址填订阅地址
2. 添加一个本地自定义规则, 内容填写 `rules: ...blabla`
3. 在当前配置页使用这两个配置源, 生成配置. 在 clashX 里选择 `clash-config-mananger` 即可.
4. 这种可以使用, 但是 2 中的 rules 如果想使用 proxy, 需要直到 1 里面的 proxy-group 中的名称. 不是很灵活, 建议使用纯服务器订阅 / 规则分开处理.

## 其他

- 使用 cmd + shift + p 打开 command palette
