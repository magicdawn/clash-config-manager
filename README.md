# clash-config-manager

> 适用于 macOS ClashX / ClashX.Meta 的 GUI 配置合并工具

## 下载

[**下载 .dmg 文件**](https://github.com/magicdawn/clash-config-manager/releases/latest)

## 类似软件

- https://github.com/crazyhl/PullAndMergeConfig
- https://github.com/surgioproject/surgio

## 功能

- [x] 支持从订阅中摘取 proxies
- [x] 支持远程规则
- [x] 支持快捷新建规则, 支持从 Chrome 当前 Tab 或 剪贴板 读取 url, 支持根据 url 解析成 DOMAIN-KEYWORD / DOMAIN-SUFFIX 规则
- [x] 支持在 vscode/Atom 中编辑规则
- [x] 支持导入导出数据, webdav 备份数据, 支持合并数据, 支持导出部分数据用于分享
- [x] 内置基础配置, 导入内置基础配置 + 添加一个 subscribe 即可开始使用.
- [x] 支持类似 vscode 的 command palette 快速操作
- [x] 支持解析 `subscription-userinfo` header
- [x] 支持使用多个订阅, 参见多个订阅

## 预览

![image](https://user-images.githubusercontent.com/4067115/199737198-68e0e3b1-3b48-4b0d-bcbe-50a0257c08d5.png)

![image](https://user-images.githubusercontent.com/4067115/188063804-07b4bf95-f8f8-4917-b1a0-47cbd07cc24c.png)

![image](https://user-images.githubusercontent.com/4067115/188063975-50d08893-d350-405a-baf8-dcc6bbaf1fc2.png)

![image](https://user-images.githubusercontent.com/4067115/188064097-ecb5867f-d4b1-4e6b-97b2-f768f9271d26.png)

![image](https://user-images.githubusercontent.com/4067115/188064169-3d07ed86-03d1-4d9d-befb-e97684383825.png)

![image](https://user-images.githubusercontent.com/4067115/188064365-9dbf9152-9875-4a6c-b0d6-69a6238fb529.png)

![image](https://user-images.githubusercontent.com/4067115/188064431-ce4d3639-aebc-45f1-b837-b6e117a3aced.png)

## 概念解释

- 订阅管理: 服务器图标, 管理订阅. 原理是从 clash config 摘取 `proxies` 字段,
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
4. 这种可以使用, 但是 2 中的 rules 如果想使用 proxy, 需要知道 1 里面的 proxy-group 中的名称. 不是很灵活, 建议使用纯服务器订阅 / 规则分开处理.

比如, rules 里写了 "proxy-group: XXX-Provider"
2 中添加的规则需要使用这个名字, 比如 `- DOMAIN-KEYWORD,google,XXX-Provider`, 或者使用 `Proxy`, 本软件中 `Proxy` 总是存在

## 功能

### command palette

- 使用 cmd + shift + p 打开 command palette

### `forceUpdate`

订阅 & 远程配置默认会使用缓存, 当天有效, 如果不想使用缓存:

- 可以使用主页按钮 "更新订阅,并重新生成配置文件"
- 或者 command palette 里的 `强制更新`

### 多个订阅

- 可以使用多个订阅
- 每个订阅会生成 `<订阅>` / `<订阅>-最快` / `<订阅>-可用` / `<订阅>-手选` 分组, 分别对应 `url-test` / `fallback` / `select` 类型的分组
- 会生成额外 proxy-group, `所有节点` / `所有节点-最快` / `所有节点-可用` / `所有节点-手选`

例如有订阅 sub1 & sub2, 会自动生成:

- `Proxy` => 选择(所有节点, 所有节点-最快, 所有节点-可用, 所有节点-手选, sub1, sub1-最快, sub1-可用, sub1-手选, sub2, sub2-最快, sub2-可用, sub2-手选)
- `所有节点` => 选择(所有节点-最快, 所有节点-可用, 所有节点-手选)
- `所有节点-最快` => url-test(sub1 & sub2 所有节点)
- `所有节点-可用` => fallback(sub1 & sub2 所有节点)
- `所有节点-手选` => select(sub1 & sub2 所有节点)
- `sub1` => 选择(sub1-最快, sub1-可用, sub1-手选)
- `sub1-最快` => url-test(sub1 所有节点)
- `sub1-可用` => fsub1back(sub1 所有节点)
- `sub1-手选` => select(sub1 所有节点)
- `sub2` => 选择(sub2-最快, sub2-可用, sub2-手选)
- `sub2-最快` => url-test(sub2 所有节点)
- `sub2-可用` => fallback(sub2 所有节点)
- `sub2-手选` => select(sub2 所有节点)

### proxy-group filter

```yml
proxy-groups:
  - { name: 🇯🇵JPN, type: select, proxies: [], filter: JPN }
  - { name: 🇭🇰HKG, type: select, proxies: [], filter: HKG }
```

支持通过名称筛选 proxies, 组成新的 proxy-group

### 配置类型

- `本地 config`: 存储在本机中, 可以是 partial config
- `远程 config`: url 返回一个配置, 可以是 partial config, 例如只包含 `rules: []`

### 规则 TARGET

```yml
rules:
  - DOMAIN-SUFFIX,youtube.com,<TARGET>
  #                             ⏫
```

规则的 `TARGET` 可以是

- clash 内置的 `DIRECT` / `REJECT` / `no-resolve`
- `Proxy` 本项目固定使用的 proxy-group 名称
- 自动生成的分组名 (例如 ALL, sub1, sub2 ....)
- 自定义名称

#### 自定义名称作为 TARGET

例如 `DOMAIN-SUFFIX,youtube.com,youtube.com` 这样的话 clash-config-manager 会自动生成名为 `youtube.com` proxy-group
可以从 GUI 中选择 `DIRECT` / `Proxy` / `根据订阅生成的组名` / `REJECT`

## 更新日志

[CHANGELOG.md](CHANGELOG.md)

## License

the MIT License http://magicdawn.mit-license.org
