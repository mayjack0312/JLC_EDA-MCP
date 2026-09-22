# JLC_EDA-MCP 架构说明

## 1. 总体结构

~~~text
AI Agent / MCP Client
        │
        │ MCP stdio
        ▼
┌──────────────────────────────┐
│          JLC_EDA-MCP         │
│                              │
│  API Tool Registry           │
│  API Catalog / Allowlist     │
│  Extension Dev Tools         │
│  Embedded EasyEDA Bridge     │
└──────────────┬───────────────┘
               │ localhost WebSocket
               ▼
┌──────────────────────────────┐
│ run-api-gateway_v1.0.6.eext │
└──────────────┬───────────────┘
               │
               ▼
       EasyEDA Pro EDA.* API
~~~

## 2. API Catalog 生成

`scripts/generate-api-catalog.mjs` 在构建时读取官方 `@jlceda/pro-api-types` 类型定义，解析 `EDA` 根对象公开命名空间及其 public 方法。

生成内容包括：

- 完整方法 ID
- namespace / className / method name
- description
- deprecated 标记
- 参数名、类型、可选性、rest 标记
- 返回类型
- overloads

生成结果保存到 `src/generated/api-catalog.json`，构建时同步到运行产物。

因此官方类型包更新后不需要人工维护数百个 Tool 声明。

## 3. Tool 注册

`src/tools/easyeda-api.ts` 注册两类入口：

### 管理 / 统一调用 Tool

- `easyeda_bridge_status`
- `easyeda_select_window`
- `easyeda_api_catalog`
- `easyeda_api_search`
- `easyeda_api_describe`
- `easyeda_api_call`

### 自动生成直接 Tool

Full 模式下，每个官方公开方法都会注册为：

`eda_<namespace>_<method>`

Compact 模式跳过这 760 个独立工具，但不减少 API Catalog 覆盖。

## 4. Bridge

`src/easyeda-bridge.ts` 内置 WebSocket Bridge：

- 仅监听 `127.0.0.1`
- 端口范围 `49620-49629`
- 自动选择第一个未占用端口
- 支持多个 EasyEDA 窗口注册
- 维护 `activeWindowId`
- API 请求使用 UUID 匹配 result / error
- 默认超时由 `EASYEDA_API_TIMEOUT_MS` 控制（30000 ms）

Gateway 断开时，对应窗口的未完成请求会被拒绝，不返回伪成功。

## 5. API 执行路径

统一调用或直接 Tool 最终都会进入同一执行逻辑：

1. 校验方法是否存在于生成目录；
2. 校验参数为 JSON-safe；
3. 检查必填参数数量；
4. 选择显式 `windowId` 或活动窗口；
5. 通过 localhost WebSocket 将调用发送给 Gateway；
6. Gateway 在 EasyEDA Pro 页面上下文调用对应 `eda[namespace][method](...args)`；
7. 将真实 result / error 返回 MCP Client。

## 6. 安全边界

- 不提供任意 JavaScript MCP Tool；
- `easyeda_api_call` 只接受生成目录中的完整方法 ID；
- namespace / method 由白名单记录决定，而不是从用户输入拼接执行；
- 参数仅允许 JSON 可序列化值；
- Bridge 只绑定 loopback 地址；
- 多窗口通过显式 windowId / activeWindowId 管理；
- EasyEDA Pro 自身权限、状态和版本校验仍然有效。

## 7. 扩展开发调试链路

`src/browser.ts` 和 `src/tools/dev-plugin.ts` 保留官方扩展开发工作流，通过 Playwright 控制 Chrome / Edge：

- 自动打开 EasyEDA Pro 调试环境
- 扫码登录及本机登录态缓存
- 导入 `.eext`
- 监听 `console` / `pageerror`
- 缓存最近 500 条日志
- `dev_plugin` 监听 error
- `get_console_logs` 可独立启动监听并读取日志

API Bridge 与浏览器调试属于同一个 MCP Server 中的两条能力链路，可以分别使用。
