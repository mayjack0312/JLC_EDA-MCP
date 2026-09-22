# Run API Gateway

[English](./README.en.md) · [FAQ 简体中文](./FAQ.md) · [FAQ English](./FAQ.en.md)

嘉立创EDA 专业版扩展 — 为 AI 编程工具（OpenCode、Claude Code、Cursor、Cline、Continue、Windsurf、WorkBuddy、QwenCode、KimiCode、Trae 等）提供 WebSocket API 网关桥接服务。

> **JLC_EDA-MCP 集成说明**
>
> 本目录中的 Run API Gateway v1.0.6 同时作为仓库根目录 **JLC_EDA-MCP v2.0** 的 EasyEDA 运行时 Gateway 使用。
> 如果你是从 `mayjack0312/JLC_EDA-MCP` 使用本扩展，**不需要另外安装 easyeda-api Skill，也不需要单独启动 Bridge Server**；JLC_EDA-MCP 已内置 Bridge、API Catalog、760 个官方 API 的 MCP 调用入口以及 Full / Compact 两种模式。
>
> JLC_EDA-MCP 用户请优先阅读 [仓库根 README](../README.md) 和 [API 使用指南](../docs/API_USAGE.md)。本目录后半部分仍保留官方上游 Gateway + easyeda-api Skill 的独立使用方式，便于单独使用或二次开发。

## 在 JLC_EDA-MCP 中使用（推荐）

### 1. 组件关系

```text
AI Agent / MCP Client
        │ MCP stdio
        ▼
JLC_EDA-MCP v2.0
        │ 内置 localhost WebSocket Bridge
        │ 127.0.0.1:49620-49629
        ▼
Run API Gateway v1.0.6
        │ EasyEDA 页面运行时
        ▼
官方 EDA.* EasyEDA Pro API
```

JLC_EDA-MCP 当前根据 `@jlceda/pro-api-types` 0.4.23 自动生成 98 个命名空间、760 个公开 API 方法的目录和直接 MCP Tool。Gateway 本身不维护这 760 个 Tool；它负责连接 EasyEDA 页面运行时、接收 Bridge 请求并在页面上下文中执行。

### 2. 最短安装步骤

1. 在仓库根目录执行 `npm install && npm run build && npm test`；
2. 在嘉立创EDA专业版导入本目录的 `run-api-gateway_v1.0.6.eext`；
3. 在扩展管理器中启用本扩展，并允许 WebSocket / 外部交互权限；
4. 启动根目录 MCP：`npm start`，或 Windows 下运行 `START_MCP_WINDOWS.bat`；
5. 在 MCP Client 中调用 `easyeda_bridge_status`；
6. 当返回 `count > 0` 后，即可使用 `easyeda_api_search` / `easyeda_api_describe` / `easyeda_api_call`，或 Full 模式下的 `eda_<namespace>_<method>` 直接工具。

多窗口时，Gateway 会为每个连接生成独立 `windowId` 并向 Bridge 注册；可通过 `easyeda_select_window` 或调用参数中的 `windowId` 指定目标窗口。

### 3. 连接与安全边界

- Gateway 启动后扫描 `127.0.0.1:49620-49629` 并校验 Bridge 握手中的 `service: "easyeda-bridge"`；
- 连接成功后注册随机 `windowId`，并通过心跳检测维持连接；
- Bridge 只监听本机 loopback 地址，不对局域网或公网开放；
- JLC_EDA-MCP 对外暴露的统一 API 调用只允许自动生成 Catalog 中的官方方法，并限制为 JSON 可序列化参数；
- Gateway 作为运行时执行端会执行可信本机 Bridge 发来的请求，因此应只连接自己信任的本机 Bridge。

## 功能

- 🔌 **自动连接** — 启动时自动扫描端口范围 49620-49629，发现并连接 Bridge Server
- 🤝 **握手验证** — 通过 WebSocket handshake 验证服务身份 (`easyeda-bridge`)
- 🔄 **自动重连** — 心跳检测 + 断线自动重新扫描端口
- 🤖 **代码执行** — 接收来自 AI 的代码请求，在 EDA 环境中执行并返回结果

## 架构

```
┌──────────────┐  HTTP/WS    ┌─────────────────┐  WebSocket   ┌──────────┐
│  AI Agent    │ ◄─────────► │  Bridge Server  │ ◄──────────► │ 本扩展    │
│ (Skill Tool) │ Port Range  │  (Node.js)      │  Port Range  │ (EasyEDA)│
└──────────────┘ 49620-49629 └─────────────────┘  49620-49629 └──────────┘
```

## 两种使用模式

### JLC_EDA-MCP 集成模式

使用本仓库根目录的 JLC_EDA-MCP 时，**无需 easyeda-api Skill**。MCP Server 自己负责：

- 启动内置 Bridge；
- 自动生成 API Catalog；
- 提供 6 个 API 管理 / 连接 Tool；
- 在 Full 模式注册 760 个直接 API Tool；
- 在 Compact 模式通过搜索、描述、统一调用访问同一批 API。

### 官方上游独立 Skill 模式

如果你把 Run API Gateway 当作独立扩展使用，而不使用本仓库根目录的 JLC_EDA-MCP，则仍可按官方上游方案配合 **easyeda-api** Skill。该 Skill 负责启动自己的 Bridge Server、提供 EasyEDA API 文档与调用约定，并负责 AI 与 EDA 之间的工作流。

## 官方上游独立 Skill 模式快速开始

如果你已经熟悉终端、Node.js 和嘉立创EDA 扩展系统，可以直接走最短路径：

1. 安装 **Node.js 22 LTS** 或更高版本：<https://nodejs.org/zh-cn/download>
2. 安装你的 AI 编程工具（任选其一）：
  - **OpenCode**：`npm install -g opencode-ai`
  - **Claude Code / QwenCode / KimiCode / WorkBuddy**：参考各自官网的安装说明
  - **Cursor / Windsurf / Trae**：从官网下载安装包双击安装
  - **Cline / Continue**：在 VS Code 扩展商店搜索安装
3. 把 **easyeda-api** 安装到 AI 工具的全局 Skill 目录：

  **让 AI Agent 一句话代为安装**（推荐）：根据你使用的工具复制对应版本发给它：

  - **OpenCode**：
    > 请帮我从 <https://github.com/easyeda/easyeda-api-skill> 安装 easyeda-api skill 到 OpenCode 的全局 Skill 目录

  - **Claude Code**：
    > 请帮我从 <https://github.com/easyeda/easyeda-api-skill> 安装 easyeda-api skill 到 Claude Code 的全局 Skill 目录

  - **Cursor / Cline / Continue / Windsurf / WorkBuddy / QwenCode / KimiCode / Trae**：
    > 请帮我从 <https://github.com/easyeda/easyeda-api-skill> 下载并安装 easyeda-api skill

  **手动下载并解压**：如果手边没有 AI Agent，可以下载 zip 后解压到全局 Skill 目录：
  - 下载地址：<https://image.lceda.cn/files/easyeda-api-skill.zip>
  - 解压目标：`~/.config/opencode/skills/easyeda-api/`（OpenCode 路径；其他工具请参考各自文档的全局 skills 目录）
  - 详细步骤见 [FAQ.md § 5.2](./FAQ.md#52-如果命令安装失败如何手动下载并安装-skill)

  进阶用户也可以使用 `npx clawhub@latest install ...` 的命令行方式，详见 [FAQ.md § 5.1](./FAQ.md#51-从-clawhub-单行命令安装)。
4. 启动 AI 工具：
  - **OpenCode / Claude Code / QwenCode / KimiCode**：在终端运行 `opencode` / `claude` / `qwencode` / `kimi`（或对应命令）
  - **Cursor / Windsurf / Trae / WorkBuddy**：双击桌面图标启动
  - **Cline / Continue**：打开 VS Code
5. 首次使用时按工具提示登录或选择模型，OpenCode 中可执行 `/connect` 选择免费模型
6. 在嘉立创EDA 专业版安装 **Run API Gateway** 扩展，并在扩展管理器中勾选 **允许外部交互** 与 **显示在顶部菜单**
7. 打开嘉立创EDA，看到顶部 **API Gateway** 菜单即可
8. 回到 AI 工具，使用 `/easyeda-api skill` 让它帮你做事，例如：
  - `使用 /easyeda-api skill 帮我检查当前原理图`
  - `使用 /easyeda-api skill 帮我画一个 NE555 最小系统`

如果你是首次接触这些工具，请阅读 [FAQ.md](./FAQ.md) 中的「从零开始使用教程」章节，里面有完整的逐步说明。

## 菜单操作

| 菜单项 | 说明 |
|--------|------|
| **Reconnect** | 手动重新扫描端口并连接 Bridge Server |
| **Stop Connection** | 断开当前连接 |
| **Toggle Auto-Connect Status** | 切换自动连接状态 |
| **About...** | 显示版本和连接状态 |

## 进阶内容

连接失败、命令提示词、各组件职责、开发者本地调试模式等内容请查阅：

- [FAQ 简体中文](./FAQ.md) — 详细的环境准备、安装步骤、故障排查与示例
- [FAQ English](./FAQ.en.md) — Detailed setup, troubleshooting and examples

也可直接访问 GitHub 在线版本：

- <https://github.com/easyeda/eext-run-api-gateway/blob/main/FAQ.md>
- <https://github.com/easyeda/eext-run-api-gateway/blob/main/FAQ.en.md>

## 开源许可

本扩展使用 [Apache License 2.0](https://choosealicense.com/licenses/apache-2.0/) 开源许可协议。
