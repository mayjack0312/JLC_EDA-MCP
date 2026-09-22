[English](./README.en.md) | 中文

# JLC_EDA-MCP — Complete EasyEDA Pro MCP

面向嘉立创EDA / EasyEDA Pro 的完整 MCP 服务。在官方扩展开发调试 MCP 基础上，自动对接当前 `@jlceda/pro-api-types` 中 `EDA` 根对象公开的全部 API，并保留插件导入、调试和浏览器控制台日志能力。

## v2.0 当前覆盖

- 98 个官方 API 命名空间
- 760 个公开 API 方法，全部生成直接 MCP Tool
- 6 个 API 管理 / 连接工具
- 保留 `import_plugin`、`dev_plugin`、`get_console_logs` 3 个扩展开发工具
- MCP Tool 总数：769
- 内置仅监听本机的 WebSocket Bridge，无需另启 Bridge 进程
- 附带官方 `bundled-gateway/run-api-gateway_v1.0.6.eext`
- bundled-gateway 按官方 `pro-api-sdk` v1.6.27 对齐 MCP 调试所需的 Debug 热加载实现（`npm run debug` / 59394）；不镜像 SDK 的项目创建、更新、manifest、模板或发布工具
- 支持 Full / Compact 两种工具暴露模式

完整统计与边界说明见 [`docs/COVERAGE_REPORT.md`](docs/COVERAGE_REPORT.md)。API 调用方法见 [`docs/API_USAGE.md`](docs/API_USAGE.md)。

## 快速开始

### 1. 环境要求

- Node.js 20.17.0+
- Google Chrome 或 Microsoft Edge（插件导入 / 浏览器日志功能使用）
- 嘉立创EDA / EasyEDA Pro

### 2. 获取并构建

~~~bash
git clone https://github.com/mayjack0312/JLC_EDA-MCP.git
cd JLC_EDA-MCP
npm install
npm run build
npm test
~~~

Windows 也可以直接运行根目录的 `START_MCP_WINDOWS.bat`。脚本会在缺少依赖时安装依赖，并在每次启动前执行构建，确保 `dist` 与当前源码一致，然后启动 MCP。

### 3. 安装 EasyEDA API Gateway

在嘉立创EDA专业版中导入：

`bundled-gateway/run-api-gateway_v1.0.6.eext`

并允许扩展所需的 WebSocket / 外部交互权限。MCP 内置 Bridge 会在 `127.0.0.1:49620-49629` 中选择可用端口，仅监听本机。

### 4. 生成 MCP 配置

~~~bash
npm run mcp-config
~~~

会在项目根目录生成 `mcp-config.json` 和 `opencode.json`，默认 MCP Server ID 为 `jlc-eda-mcp`。将对应配置导入所使用的 AI Agent 后重启 Agent。

> 生成配置默认不会自动批准 760 个 EasyEDA API Tool；是否自动批准高权限工具由客户端侧自行决定。

### 5. 确认连接

在 MCP Client / Agent 中调用：

`easyeda_bridge_status`

若 `count > 0` 且存在已连接窗口，即可开始调用官方 EasyEDA Pro API。多窗口时可使用 `easyeda_select_window` 指定目标窗口。

## API 调用方式

### Full 模式（默认）

默认 `EASYEDA_TOOL_PROFILE=all`，760 个官方方法均注册成独立 MCP Tool。工具名格式为：

`eda_<namespace>_<method>`

直接 API Tool 统一接受：

- `args`：按官方签名顺序排列的 JSON 参数数组
- `windowId`：可选；多窗口时指定目标 EDA 窗口

Full 模式适合能够承载较大 `tools/list` 的 Agent / MCP Client。

### Compact 模式

若客户端无法稳定承载 760 个直接 Tool，可设置：

~~~text
EASYEDA_TOOL_PROFILE=compact
~~~

Compact 模式不注册 760 个独立 Tool，但仍可通过以下流程访问全部官方方法：

~~~text
easyeda_api_search
        ↓
easyeda_api_describe
        ↓
easyeda_api_call
~~~

例如查询当前工程信息时，可先搜索 API，再描述 `dmt_Project.getCurrentProjectInfo` 的完整签名，最后通过 `easyeda_api_call` 调用。

## 6 个 API 管理 / 连接工具

| Tool | 作用 |
|---|---|
| `easyeda_bridge_status` | 查看 Bridge、当前活动窗口及全部已连接 EDA 窗口 |
| `easyeda_select_window` | 多窗口时选择后续 API 调用的目标窗口 |
| `easyeda_api_catalog` | 查看官方 API 类型版本、命名空间和方法统计 |
| `easyeda_api_search` | 按方法名、命名空间、说明或参数类型搜索 API |
| `easyeda_api_describe` | 获取方法完整签名、参数、返回值、重载和弃用信息 |
| `easyeda_api_call` | 调用自动生成白名单中的任一官方 API |

## 扩展开发 / 调试工具

| Tool | 作用 |
|---|---|
| `import_plugin` | 自动导入 `.eext` 插件，并开启浏览器控制台监听 |
| `dev_plugin` | 导入插件并监听 error；检测到错误后返回日志供 Agent 分析 |
| `get_console_logs` | 获取浏览器控制台日志；可独立调用，支持过滤、限制条数和清空缓存 |

`get_console_logs` 不再要求必须先调用 `import_plugin` / `dev_plugin`。若当前没有监听器，它会自动连接浏览器并启动监听。


### 官方 SDK Debug 热加载

`bundled-gateway` 的开发框架已对齐官方 `pro-api-sdk` v1.6.27。需要 EasyEDA 官方扩展 Debug 热加载时：

~~~bash
cd bundled-gateway
npm install
npm run debug
~~~

该模式会在 `ws://localhost:59394` 启动官方 SDK Debug Server，监听源码变化，自动增量构建、重新打包并向 EasyEDA Pro 官方 Debug 客户端推送新的 `.eext`。

> `59394` 是 SDK 热加载专用端口；JLC_EDA-MCP API Bridge 仍使用 `127.0.0.1:49620-49629`。

## 工作原理

### EasyEDA API

~~~text
AI Agent / MCP Client
        │ stdio
        ▼
JLC_EDA-MCP
        │ localhost WebSocket
        ▼
run-api-gateway_v1.0.6.eext
        │
        ▼
EDA.* 官方 EasyEDA Pro API
~~~

API 目录由构建脚本从 `@jlceda/pro-api-types` 自动生成，不手工维护 760 个工具定义。统一调用只允许目录白名单中的 `namespace.method`，参数必须为 JSON 可序列化值。

### 插件开发调试

插件导入 / 控制台日志功能使用 Playwright 控制 Chrome / Edge。登录状态保存在本机 `.browser-data/`，最多缓存 500 条浏览器控制台日志。

## 更新官方 SDK / API 目录

当前包使用 `@jlceda/pro-api-types` 0.4.23。升级版本后执行：

~~~bash
npm install
npm run build
npm test
~~~

`npm run build` 会重新扫描官方类型定义并生成 API Catalog；`npm test` 会检查 Tool 数量、重复名称和关键管理工具。

## 环境变量

| 变量 | 说明 | 默认值 |
|---|---|---|
| `EASYEDA_TOOL_PROFILE` | `all` 注册全部直接 API Tool；`compact` 仅保留管理 / 统一调用入口 | `all` |
| `EASYEDA_API_TIMEOUT_MS` | EasyEDA API 单次调用超时 | `30000` |
| `CHROME_PATH` | 手动指定 Chrome / Chromium / Edge 路径 | 自动检测 |

## 文档

- [`docs/API_USAGE.md`](docs/API_USAGE.md)：完整 API 搜索、描述、调用、多窗口和 Full / Compact 使用方法
- [`docs/COVERAGE_REPORT.md`](docs/COVERAGE_REPORT.md)：官方 API 覆盖统计和安全边界
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)：整体架构、Bridge、API Catalog 与安全设计
- [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md)：连接、Gateway、超时、工具过多、浏览器日志等常见问题

## 说明

这里的“100% API 覆盖”表示当前官方类型定义中 `EDA` 根对象公开的方法均进入 API Catalog、统一调用白名单并生成直接 MCP Tool；并不表示所有 API 都能通过纯 JSON 参数远程执行。包含回调函数、浏览器对象、`File` / `Blob`，或受特定版本、编辑器状态、权限限制的方法，仍以 EasyEDA Pro 实际运行时行为为准。

本项目基于 EasyEDA 官方 `extension-dev-mcp-tools` 的扩展开发调试能力继续完善。许可证和第三方声明见 `LICENSE` 与 `NOTICE.txt`。
