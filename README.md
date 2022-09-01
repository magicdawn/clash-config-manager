# clash-config-manager

> 用于 MacOS clashX 的 GUI 配置合并工具

## 下载

[**下载 .dmg 文件**](https://github.com/magicdawn/clash-config-manager/releases/latest)

## 类似软件

- https://github.com/crazyhl/PullAndMergeConfig
- https://github.com/surgioproject/surgio

## 功能

- [x] 支持 v2ray 纯服务器订阅,不含规则, 比如 iOS 端 ShadowRocket 的 subscribe 所使用的格式
- [x] 支持远程规则 / 支持 clash 规则订阅. (不推荐这种,自定义规则的 target 需要与订阅里的 proxy group 一致, 不方便写自定义规则)
- [x] 支持导入导出数据, webdav 备份数据, 支持合并数据, 支持导出部分数据用于分享
- [x] 支持在应用中编辑规则
- [x] 支持在 vscode/Atom 中编辑规则
- [x] 支持从 剪贴板/Chrome 快速添加规则
- [x] 内置基础配置, 导入内置基础配置 + 添加一个 subscribe 即可开始使用.
- [x] 支持类似 Atom / vscode 的 command palette 快速操作
- [ ] 支持 `ccm://` 协议
- [ ] 支持命令行

## 截图

![](https://i.loli.net/2020/09/22/7Xwu3PBRpi6xG1Y.png)
![](https://i.loli.net/2020/09/22/9KHJ5WTEzeFaXsP.png)
![Xnip2020-10-03_02-12-54.png](https://i.loli.net/2020/10/03/ZPn3QraOIKWsuvR.png)

## 概念解释

- 订阅管理: 人民币图标, 购买的服务, 订阅 url 会返回服务器节点.
- 配置源(Partial Config): clash 完整配置的一部分. 配置分为本地和远程配置, 有一些订阅会返回 clash 完整的配置文件, 即是远程配置.
- 配置组装(Config Builder): 通过拖拽订阅和配置源(Partial Config) 组成一份完整的 clash 配置. 其中订阅会填充最后配置的 Proxy 部分, 可多选.

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

比如, rules 里写了 "proxy-group: XXX-Provider"
2 中添加的规则需要使用这个名字, 比如 `- DOMAIN-KEYWORD,google,XXX-Provider`

## 其他

- 使用 cmd + shift + p 打开 command palette
