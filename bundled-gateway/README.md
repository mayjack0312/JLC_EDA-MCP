# Run API Gateway

[English](./README.en.md) · [FAQ 简体中文](./FAQ.md) · [FAQ English](./FAQ.en.md)

嘉立创EDA 专业版扩展，用于把正在运行的 EasyEDA Pro 页面连接到 **JLC_EDA-MCP v2.0** 的本机 Bridge。

> **当前仓库推荐用法**
>
> 使用 `mayjack0312/JLC_EDA-MCP` 时，**不需要另外安装 easyeda-api Skill，不需要 ClawHub，也不需要单独启动另一个 Bridge Server**。
> JLC_EDA-MCP 根目录已经包含 MCP Server、Bridge、API Catalog、Full / Compact 两种 Tool 模式以及 760 个当前官方类型定义公开 API 的调用入口。

## 架构

```text
AI Agent / MCP Client
        │ MCP stdio
        ▼
JLC_EDA-MCP v2.0
        │ embedded easyeda-bridge
        │ 127.0.0.1:49620-49629
        ▼
Run API Gateway v1.0.6
        │ EasyEDA 页面运行时
        ▼
官方 EasyEDA Pro EDA.* API
```

JLC_EDA-MCP 当前根据 `@jlceda/pro-api-types` 0.4.23 自动生成：

- 98 个 EDA 根命名空间
- 760 个公开 API 方法
- 760 个 Full 模式直接 API Tool
- 6 个 API 管理 / 连接 Tool
- 3 个扩展开发 / 调试 Tool
- Full 模式合计 769 个 MCP Tool

Gateway 本身不维护这 760 个 Tool。它负责在 EasyEDA 页面上下文中：

- 扫描并连接本机 Bridge
- 验证 `service: "easyeda-bridge"` 握手
- 为每个 EDA 窗口注册独立 `windowId`
- 接收 Bridge 请求并在页面运行时执行
- 返回结果或错误
- 维持心跳并在掉线后自动重连

## 快速开始

### 1. 构建并启动 JLC_EDA-MCP

在仓库根目录执行：

```bash
npm install
npm run build
npm test
npm start
```

Windows 也可以直接运行：

```text
START_MCP_WINDOWS.bat
```

### 2. 在 EasyEDA Pro 中安装 Gateway

导入本目录已经附带的：

```text
bundled-gateway/run-api-gateway_v1.0.6.eext
```

在扩展管理器中启用扩展，并允许它使用 WebSocket / 外部交互能力。

扩展正常加载后，顶部会出现 **API Gateway** 菜单。

### 3. 验证连接

在 MCP Client 中调用：

```text
easyeda_bridge_status
```

当返回的 `count > 0` 时，说明至少一个 EasyEDA 窗口已经注册到 Bridge。

之后建议按下面顺序调用：

```text
easyeda_api_search
    ↓
easyeda_api_describe
    ↓
easyeda_api_call
```

Full 模式下，也可以直接使用自动生成的：

```text
eda_<namespace>_<method>
```

例如一个方法的完整 ID 可能是：

```text
dmt_Project.getCurrentProjectInfo
```

## 官方 SDK 1.6.27 Debug 热加载

本目录只对齐官方 `easyeda/pro-api-sdk` **v1.6.27** 中 MCP 辅助调试所需的 Debug 热加载链路。Gateway 运行版本仍为 **Run API Gateway v1.0.6**。这里不是完整 SDK 镜像，也不承担 SDK 项目创建、更新、manifest 或发布职责。

进入本目录后安装依赖：

```bash
cd bundled-gateway
npm install
```

启动官方 Debug 热加载：

```bash
npm run debug
```

官方 `build/dev.ts` 会：

1. 在 `ws://localhost:59394` 启动 Debug WebSocket Server；
2. 对 `src/index.ts` 执行初始 esbuild；
3. 自动打包最新 `.eext`；
4. 监听源码变化；
5. 构建成功后进行 300 ms 防抖；
6. 自动重新打包；
7. 将新的 `.eext` 以 Base64 推送给已经连接的 EasyEDA Pro Debug 客户端。

```text
源码修改
  ↓
esbuild watch
  ↓
重新打包 .eext
  ↓
ws://localhost:59394
  ↓
EasyEDA Pro 官方 Debug / 热加载客户端
```

**59394 是官方 SDK Debug 热加载端口，不是 JLC_EDA-MCP API Bridge。** 正常 MCP/API 通道仍使用 `127.0.0.1:49620-49629`。

为了支持这条 Debug 链路，本仓库只保留官方 `build/dev.ts`、`build/utils.ts`、`config/esbuild.common.ts` 及必要依赖。SDK 的项目创建器、自更新、manifest、模板资源和通用发布工具不属于 MCP 职责，不在本仓库镜像。

## Full 与 Compact

### Full

默认模式。注册 760 个直接 API Tool，适合 MCP Client 能承受较大 `tools/list` 的场景。

### Compact

如果客户端因为 Tool 数量过多出现超时、上下文膨胀或工具列表限制，可以设置：

**PowerShell**

```powershell
$env:EASYEDA_TOOL_PROFILE="compact"
npm start
```

**cmd**

```bat
set EASYEDA_TOOL_PROFILE=compact
npm start
```

Compact 模式不会注册 760 个直接 Tool，但完整 API Catalog 仍然可通过：

- `easyeda_api_catalog`
- `easyeda_api_search`
- `easyeda_api_describe`
- `easyeda_api_call`

访问。

## 多窗口

每一个连接到 Bridge 的 EasyEDA 窗口都会获得独立 `windowId`。

当同时打开多个 EasyEDA 窗口时，可以使用：

```text
easyeda_bridge_status
easyeda_select_window
```

或者在支持的 API 调用中显式传入 `windowId`，避免把操作发到错误窗口。

## 连接机制

Gateway 会扫描：

```text
127.0.0.1:49620
...
127.0.0.1:49629
```

并连接：

```text
ws://127.0.0.1:<port>/eda
```

连接成功必须满足握手：

```json
{
  "type": "handshake",
  "service": "easyeda-bridge"
}
```

之后 Gateway 生成随机 `windowId` 并向 Bridge 注册。

Gateway 内置心跳检测；连接异常时会关闭旧连接并重新扫描端口。

## 菜单

| 菜单项 | 作用 |
|---|---|
| **Reconnect** | 重新扫描端口并连接 Bridge |
| **Stop Connection** | 停止当前连接与重试 |
| **Toggle Auto-Connect Status** | 开启 / 关闭启动自动连接 |
| **About...** | 查看版本、端口、窗口连接状态 |

## 常见问题

### `easyeda_bridge_status` 返回 `count: 0`

依次确认：

1. 根目录 JLC_EDA-MCP 已经启动；
2. EasyEDA Pro 正在运行；
3. `run-api-gateway_v1.0.6.eext` 已启用；
4. 扩展具有外部交互 / WebSocket 权限；
5. 本机安全软件没有拦截 loopback WebSocket；
6. 端口 `49620-49629` 没有被不相关程序占用。

完整排查请看 [FAQ.md](./FAQ.md) 和 [../docs/TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md)。

### Tool 太多

切换到 Compact 模式。

### 多窗口操作错对象

先调用 `easyeda_bridge_status` 查看窗口，再使用 `easyeda_select_window`。

## 上游兼容说明

本目录的 Gateway 源自官方 Run API Gateway v1.0.6，并保留其独立运行能力。

但是在 **JLC_EDA-MCP 仓库文档中不再推荐或维护旧的 easyeda-api Skill / ClawHub 安装流程**。如果你专门需要官方上游的独立 Skill 工作流，请参考对应上游项目自己的文档；不要把那套流程与本仓库的 JLC_EDA-MCP 集成模式混用。

## 进一步阅读

- [JLC_EDA-MCP 中文 README](../README.md)
- [API 使用指南](../docs/API_USAGE.md)
- [架构说明](../docs/ARCHITECTURE.md)
- [API 覆盖报告](../docs/COVERAGE_REPORT.md)
- [故障排查](../docs/TROUBLESHOOTING.md)
- [本 Gateway FAQ](./FAQ.md)
- [开发约定](./AGENTS.md)

## License

本扩展继续遵循仓库中附带的 Apache License 2.0。
