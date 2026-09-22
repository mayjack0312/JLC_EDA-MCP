# Changelog

## 2.0.0 — 2026-09-22

### Added
- Automatically generate MCP coverage from the official `@jlceda/pro-api-types` package.
- Connect all 760 currently public EasyEDA Pro API methods across 98 namespaces.
- Generate one direct MCP Tool for every public SDK method.
- Add `easyeda_bridge_status`, `easyeda_select_window`, `easyeda_api_catalog`, `easyeda_api_search`, `easyeda_api_describe`, and `easyeda_api_call`.
- Add an embedded localhost-only WebSocket Bridge compatible with the official Run API Gateway extension.
- Add Full and Compact tool profiles.
- Bundle the official Apache-2.0 `run-api-gateway_v1.0.6.eext`.
- Add generated coverage reporting and MCP smoke tests.
- Add API usage, architecture, and troubleshooting documentation.

### Changed
- Reposition the project from extension-debugging-only MCP to Complete EasyEDA Pro MCP while preserving the original development tools.
- Document `get_console_logs` as independently callable, matching its current runtime behavior.
- Rename the runtime MCP/server configuration identity to `jlc-eda-mcp` while preserving historical upstream attribution.
- Keep the tracked `dist` output synchronized with `src`, and make the Windows launcher rebuild before startup.
- Rebuild the bundled Gateway artifact after removing obsolete tutorial assets.
- Align the bundled Gateway development framework with official `pro-api-sdk` v1.6.27, including `npm run debug` hot reload on port 59394, SDK update tooling, manifest tooling, ESM/Bundler configuration, and the official shared packaging utilities.

## 1.3.4

### 新增
- 支持通过对话的形式选择调试浏览器。
- 支持多浏览器调试，可同时打开 Edge 和 Chrome 浏览器。

### 优化
- 支持单独调用 `get_console_logs`，不再依赖于 `dev_plugin`、`import_plugin` 导入后才支持调试。

## 1.3.3

### 新增
- `dev_plugin` 修改为调试触发，新增支持连续 5 分钟的 error 日志监听；如果出现 error，则继续监听 5 秒日志后返回 Agent 执行错误分析并修复。
- 新增支持窗口比例较小时高级菜单即便被隐藏也能正常执行插件导入。
- 新增自动构建 OpenCode 的 MCP 配置文件。

### 修复
- 补充浏览器启动参数，避免浏览器进入向导界面导致工具失效。

## 1.3.2

### 修复
- 修复关闭浏览器后再次调用报 `ECONNREFUSED` 的问题。
- Chrome 路径查找优化，支持 Windows / macOS / Linux 自动检测。
- 支持环境变量 `CHROME_PATH` 手动指定浏览器路径。
- `import_plugin` / `dev_plugin` 工具描述中增加产物位置及 `.eext` 后缀提示。

## 1.3.1

### 新增
- `import_plugin`：将本地插件文件导入嘉立创EDA专业版。
- `dev_plugin`：导入插件并开启浏览器控制台日志监听。
- `get_console_logs`：获取控制台日志，支持过滤、限制条数和清空缓存。
- 自动启动 Chrome 并通过 CDP 远程连接。
- 登录状态持久化缓存，扫码登录后无需重复登录。
- `generate-mcp-config` 脚本，自动生成 MCP 配置文件。
