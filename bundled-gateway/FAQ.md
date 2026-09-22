# Run API Gateway — FAQ

[English](./FAQ.en.md) · [Gateway README](./README.md) · [JLC_EDA-MCP README](../README.md)

本文档只描述 **JLC_EDA-MCP v2.0 当前集成方式**。旧的 easyeda-api Skill、ClawHub、Skill ZIP 下载与 OpenCode 专用安装流程不再作为本仓库的推荐使用路径。

## 1. 当前到底需要安装哪些东西？

只需要三部分：

1. **JLC_EDA-MCP v2.0** — 仓库根目录的 MCP Server；
2. **Run API Gateway v1.0.6** — 本目录附带的 `run-api-gateway_v1.0.6.eext`；
3. **支持 MCP 的客户端 / Agent** — 连接仓库根目录 MCP Server。

不需要额外安装 easyeda-api Skill，也不需要另外启动第二个 Bridge Server。

## 2. 正确的数据链路是什么？

```text
MCP Client
   ↓ stdio
JLC_EDA-MCP
   ↓ localhost WebSocket
127.0.0.1:49620-49629
   ↓
Run API Gateway
   ↓
EasyEDA Pro EDA.*
```

## 3. 为什么还需要 Gateway？

MCP Server 运行在 Node.js 进程中，而官方 `eda.*` API 位于 EasyEDA Pro 页面运行时。

Gateway 负责把两者接起来：

- 连接本机 Bridge；
- 在 EasyEDA 页面环境里执行请求；
- 将返回值 / 错误送回 MCP Server；
- 为不同 EasyEDA 窗口注册不同 `windowId`；
- 管理心跳与自动重连。

## 4. Gateway 会连接哪里？

只扫描：

```text
127.0.0.1:49620-49629
```

WebSocket 路径：

```text
/eda
```

完整形式：

```text
ws://127.0.0.1:<port>/eda
```

Gateway 会校验握手中的：

```text
service = easyeda-bridge
```

因此不会把端口上任意 WebSocket 服务都当成正确 Bridge。

## 5. 怎么判断是否连接成功？

调用：

```text
easyeda_bridge_status
```

重点看：

- `count`
- `activeWindowId`
- `windows`

如果 `count > 0`，表示至少一个 EasyEDA 窗口已经连接。

## 6. `count: 0` 怎么处理？

按这个顺序检查：

1. JLC_EDA-MCP 是否已启动；
2. EasyEDA Pro 是否已启动；
3. Gateway 扩展是否已启用；
4. EasyEDA 扩展管理器是否允许外部交互 / WebSocket；
5. 点击 **API Gateway → Reconnect**；
6. 检查 `49620-49629` 是否有端口冲突；
7. 检查安全软件、代理软件或企业终端防护是否拦截 loopback WebSocket。

Windows PowerShell 可检查端口：

```powershell
Get-NetTCPConnection -LocalPort 49620,49621,49622,49623,49624,49625,49626,49627,49628,49629 -ErrorAction SilentlyContinue
```

更完整排查见 [../docs/TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md)。

## 7. 为什么有 760 个直接 Tool？

当前 API Catalog 根据：

```text
@jlceda/pro-api-types 0.4.23
```

生成，共有：

- 98 个根命名空间
- 760 个去重公开方法

Full 模式会把 760 个方法分别注册成直接 Tool。

## 8. 为什么总数是 769？

Full 模式：

```text
760 直接 API Tool
+ 6 API 管理 / 连接 Tool
+ 3 扩展开发 / 调试 Tool
= 769
```

详细统计见 [../docs/COVERAGE_REPORT.md](../docs/COVERAGE_REPORT.md)。

## 9. Tool 太多怎么办？

使用 Compact 模式：

```powershell
$env:EASYEDA_TOOL_PROFILE="compact"
npm start
```

Compact 不注册 760 个直接 Tool，但 API 完整性不变。

建议流程：

```text
easyeda_api_search
    ↓
easyeda_api_describe
    ↓
easyeda_api_call
```

## 10. 如何查询某个 API？

例如不知道工程相关方法名时：

1. `easyeda_api_search` 搜索 `project`；
2. 找到候选方法；
3. `easyeda_api_describe` 查看参数；
4. `easyeda_api_call` 调用。

不要靠猜测方法名或参数结构。

## 11. 多窗口怎么处理？

每个 EasyEDA 页面窗口都会注册独立 `windowId`。

先调用：

```text
easyeda_bridge_status
```

然后：

```text
easyeda_select_window
```

或者在支持的 API 调用中显式传 `windowId`。

## 12. Gateway 菜单分别干什么？

| 菜单 | 说明 |
|---|---|
| **Reconnect** | 中止当前连接流程并重新扫描 Bridge |
| **Stop Connection** | 停止连接、心跳和自动重试 |
| **Toggle Auto-Connect Status** | 修改启动时自动连接开关 |
| **About...** | 显示版本和当前连接状态 |

## 13. Gateway 会自动重连吗？

会。

连接成功后 Gateway 定期发送心跳。如果心跳超时或发送失败，会清理当前连接并重新扫描端口。

扫描不到 Bridge 时也会按内部重试策略继续尝试，达到本轮最大重试次数后停止自动尝试；可使用 **Reconnect** 重新开始。

## 14. API 调用为什么会失败？

常见原因：

- 参数数量不正确；
- 参数不是 JSON-safe 类型；
- API 需要回调、浏览器对象、File / Blob 等无法直接从 MCP JSON 传入的对象；
- 当前编辑器 / 项目状态不满足 API 前置条件；
- API 依赖特定 EasyEDA 版本、权限或上下文；
- 调用超时。

“760 / 760 已生成”代表类型定义中的公开方法全部进入 Catalog / allowlist / Tool 生成流程，不代表所有方法在任何运行环境和任意参数下都必然成功。

## 15. 调用超时怎么办？

根目录可通过：

```text
EASYEDA_API_TIMEOUT_MS
```

调整 API 调用超时。

首先应判断究竟是：

- Gateway 没连接；
- API 本身执行很慢；
- API 在等待不可序列化交互；
- 当前 EasyEDA 状态不满足调用条件。

不要单纯把超时无限增大。

## 16. Gateway 可以连接局域网 Bridge 吗？

当前 JLC_EDA-MCP 集成设计不是这样工作的。

Bridge 绑定本机 loopback，Gateway 扫描 `127.0.0.1`。这是当前安全边界的一部分。

## 17. 旧 easyeda-api Skill 文档去哪了？

本仓库已经不再维护那套安装教程。

原因是当前 JLC_EDA-MCP 已经直接提供：

- MCP Server
- Bridge
- API Catalog
- Tool 生成
- 搜索 / 描述 / 调用入口
- 多窗口管理

继续保留旧 Skill / ClawHub / ZIP 安装步骤会让用户误以为这些仍是 JLC_EDA-MCP 的必要依赖。

如果你专门要使用官方上游 Gateway 的独立 Skill 模式，请以对应上游项目自身文档为准。

## 18. 本地开发 Gateway 怎么做？

进入本目录：

```bash
npm install
npm run lint
npm run build
```

当前子项目没有单独测试框架，因此 Gateway 代码变更至少应通过 lint、build，并在 EasyEDA Pro 中做实际连接验证。

构建产物位于子项目的构建输出目录。

## 19. 进一步文档

- [API 使用指南](../docs/API_USAGE.md)
- [架构说明](../docs/ARCHITECTURE.md)
- [覆盖报告](../docs/COVERAGE_REPORT.md)
- [故障排查](../docs/TROUBLESHOOTING.md)
- [开发约定](./AGENTS.md)
