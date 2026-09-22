# Troubleshooting

## `easyeda_bridge_status` 显示 `count: 0`

依次检查：

1. 嘉立创EDA / EasyEDA Pro 是否已打开；
2. `bundled-gateway/run-api-gateway_v1.0.6.eext` 是否已导入并启用；
3. Gateway 是否获得 WebSocket / 外部交互相关权限；
4. MCP Server 是否成功启动并打印 Bridge 监听端口；
5. 本机安全软件是否阻止 EasyEDA 页面连接 `127.0.0.1`。

Bridge 只监听 `127.0.0.1:49620-49629`。

## 报错“没有已连接的嘉立创EDA窗口”

这表示 MCP 已启动，但没有 Gateway 注册的 EDA 窗口。先解决 `easyeda_bridge_status` 的连接状态，再重试业务 API。

## 多窗口调用到了错误工程

先调用 `easyeda_bridge_status` 查看 `windows` 和 `activeWindowId`。

然后：

- 使用 `easyeda_select_window` 设置默认窗口；或
- 在具体 API Tool / `easyeda_api_call` 中显式传 `windowId`。

## MCP Client 加载 Tool 很慢 / tools/list 过大

默认 Full 模式会注册 760 个直接 API Tool。切换 Compact：

~~~text
EASYEDA_TOOL_PROFILE=compact
~~~

Compact 模式仍可通过 `easyeda_api_search`、`easyeda_api_describe`、`easyeda_api_call` 使用全部 760 个方法。

## `easyeda_api_call` 提示未知 API

不要猜方法 ID。先调用：

`easyeda_api_search` → `easyeda_api_describe`

方法 ID 必须与当前生成目录完全一致。

## 参数数量错误

先用 `easyeda_api_describe` 查看参数、可选项和重载。

`args` 必须按官方签名顺序排列，而不是按对象字段名随意传入。

## 参数包含不可序列化值

统一调用只接受 JSON-safe 参数。function、DOM 对象、`File`、`Blob` 等不能直接通过该入口传输。

这种 API 即使出现在 760 方法覆盖范围内，也可能需要 EasyEDA 页面内原生上下文才能完成。

## API 调用超时

默认超时为 30000 ms，可通过 `EASYEDA_API_TIMEOUT_MS` 修改。

如果只有单个重操作 API 超时，可适当增加；如果多数普通 API 都超时，应优先检查 Gateway 和窗口连接。

## `get_console_logs` 提示暂无日志

`get_console_logs` 可以独立调用，并会在没有 listener 时自动启动监听。调用后仍为空通常意味着当前监听周期内没有新的浏览器控制台消息。

可使用：

- `filter`: 按 error / warn / 关键词过滤
- `count`: 限制返回最近 N 条
- `clear`: 获取后清空缓存
- `browserPath`: 显式指定浏览器

## 浏览器自动检测失败

可以通过工具参数 `browserPath` 指定 Chrome / Edge 可执行文件，也可以设置环境变量：

`CHROME_PATH`

Windows 会优先检查注册表 App Paths 和常见安装位置；macOS / Linux 会检查常见浏览器路径。

## 更新 `@jlceda/pro-api-types` 后 Tool 数量变化

这是正常现象。执行：

~~~bash
npm install
npm run build
npm test
~~~

并检查 `docs/COVERAGE_REPORT.md` 是否需要随新的官方 SDK 基线重新生成 / 更新统计说明。

## `npm test` Tool 数量不一致

当前 smoke test 以生成目录的方法数量加 9 个固定工具为基准：6 个 API 管理工具 + 3 个扩展开发工具。

如果新增或删除固定 Tool，需要同步更新 smoke test 期望值；如果只是官方 API 数量变化，生成目录会自动参与计算。


## `npm run debug` 热加载没有生效

最新版 bundled-gateway 已对齐官方 pro-api-sdk v1.6.27。进入子项目后执行：

~~~bash
cd bundled-gateway
npm install
npm run debug
~~~

正常启动应看到 Debug Server 监听：

~~~text
ws://localhost:59394
~~~

以及初始 build / package / file watcher 日志。

如果没有热加载：

1. 检查 `59394` 是否已被其他程序占用；
2. 确认 EasyEDA Pro 已进入官方扩展 Debug / 热加载客户端状态并连接该本机端口；
3. 检查源码修改是否触发 esbuild；
4. 如果构建报错，SDK 不会推送失败产物，先修复构建错误；
5. 检查安全软件是否阻止 localhost WebSocket。

Windows 可检查：

~~~powershell
Get-NetTCPConnection -LocalPort 59394 -ErrorAction SilentlyContinue
~~~

注意：`easyeda_bridge_status` 只检查 `49620-49629` API Bridge，它不能用于判断 `59394` SDK Debug 通道是否连接。

