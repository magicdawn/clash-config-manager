# Deps

## `electron-store`

v8 -> v10
开发过程中丢失所有数据...
存储无价, 数据有价! 定期备份!
排查不是 electron-store 版本导致, 而是双启动 `requestSingleInstanceLock` app.quit 之后还有逻辑, 没有直接 return 的问题.
