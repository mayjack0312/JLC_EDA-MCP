# Run API Gateway

[简体中文](./README.md) · [FAQ 简体中文](./FAQ.md) · [FAQ English](./FAQ.en.md)

EasyEDA Pro extension — provides a WebSocket API gateway bridge for AI coding tools (OpenCode, Claude Code, Cursor, Cline, Continue, Windsurf, WorkBuddy, QwenCode, KimiCode, Trae, etc.).

> **JLC_EDA-MCP integration**
>
> The Run API Gateway v1.0.6 in this directory is also the EasyEDA runtime gateway bundled with the repository-root **JLC_EDA-MCP v2.0**.
> When using it through `mayjack0312/JLC_EDA-MCP`, you **do not need to install the easyeda-api Skill or start a separate Bridge Server**. JLC_EDA-MCP already provides the embedded bridge, generated API catalog, MCP access to all 760 currently cataloged official APIs, and Full / Compact tool profiles.
>
> JLC_EDA-MCP users should start with the [repository README](../README.en.md) and [API usage guide](../docs/API_USAGE.md). The later sections of this document retain the official upstream Gateway + easyeda-api Skill workflow for standalone use and development.

## Using It with JLC_EDA-MCP (Recommended)

### 1. Component relationship

```text
AI Agent / MCP Client
        │ MCP stdio
        ▼
JLC_EDA-MCP v2.0
        │ embedded localhost WebSocket Bridge
        │ 127.0.0.1:49620-49629
        ▼
Run API Gateway v1.0.6
        │ EasyEDA page runtime
        ▼
Official EasyEDA Pro EDA.* APIs
```

JLC_EDA-MCP currently generates a catalog for 98 namespaces and 760 public API methods from `@jlceda/pro-api-types` 0.4.23. The Gateway itself does not maintain those 760 MCP tools; it connects the EasyEDA page runtime, receives bridge requests, and executes them in page context.

### 2. Shortest setup

1. From the repository root, run `npm install && npm run build && npm test`.
2. Import `run-api-gateway_v1.0.6.eext` from this directory into EasyEDA Pro.
3. Enable the extension and allow the required WebSocket / external-interaction permission.
4. Start the root MCP with `npm start`, or use `START_MCP_WINDOWS.bat` on Windows.
5. Call `easyeda_bridge_status` from the MCP client.
6. Once `count > 0`, use `easyeda_api_search` / `easyeda_api_describe` / `easyeda_api_call`, or the Full-profile direct tools named `eda_<namespace>_<method>`.

With multiple EasyEDA windows, each Gateway connection generates and registers its own `windowId`. Select the target through `easyeda_select_window` or pass `windowId` on an API call.

### 3. Connection and trust boundary

- The Gateway scans `127.0.0.1:49620-49629` and validates `service: "easyeda-bridge"` in the bridge handshake.
- After connecting it registers a random `windowId` and maintains the connection with heartbeat checks.
- The JLC_EDA-MCP bridge binds only to the local loopback interface, not to the LAN or public network.
- JLC_EDA-MCP's public unified API entry point only accepts methods from the generated official API catalog and JSON-serializable arguments.
- The Gateway is the runtime executor and executes requests received from the trusted local bridge, so it should only be connected to a bridge you trust.

## Features

- 🔌 **Auto-Connect** — On startup, automatically scans port range 49620-49629 to discover and connect to the Bridge Server.
- 🤝 **Handshake Verification** — Verifies the service identity through a WebSocket handshake (`easyeda-bridge`).
- 🔄 **Auto-Reconnect** — Heartbeat detection + automatic port re-scan on disconnect.
- 🤖 **Code Execution** — Receives code requests from AI, executes them inside the EDA environment, and returns results.

## Architecture

```
┌──────────────┐  HTTP/WS    ┌─────────────────┐  WebSocket   ┌──────────┐
│  AI Agent    │ ◄─────────► │  Bridge Server  │ ◄──────────► │ Extension│
│ (Skill Tool) │ Port Range  │  (Node.js)      │  Port Range  │ (EasyEDA)│
└──────────────┘ 49620-49629 └─────────────────┘  49620-49629 └──────────┘
```

## Two Usage Modes

### JLC_EDA-MCP integrated mode

When using the repository-root JLC_EDA-MCP, **the easyeda-api Skill is not required**. The MCP server itself:

- starts the embedded bridge;
- generates the API catalog;
- exposes six API management / connection tools;
- registers 760 direct API tools in Full mode;
- keeps all APIs available through search / describe / unified calls in Compact mode.

### Official upstream standalone Skill mode

If you use Run API Gateway as a standalone extension without the repository-root JLC_EDA-MCP, you can still follow the official upstream workflow with the **easyeda-api** Skill. In that mode the Skill starts its own Bridge Server and supplies the API documentation and calling workflow.

## Official Upstream Standalone Skill Quick Start

If you are already familiar with the terminal, Node.js, and the EasyEDA extension system, follow the shortest path:

1. Install **Node.js 22 LTS** or higher: <https://nodejs.org/en/download>
2. Install your AI coding tool (pick one):
  - **OpenCode**: `npm install -g opencode-ai`
  - **Claude Code / QwenCode / KimiCode / WorkBuddy**: see each tool's official install guide
  - **Cursor / Windsurf / Trae**: download the installer from the official site
  - **Cline / Continue**: install from the VS Code extension marketplace
3. Install **easyeda-api** to your AI tool's global Skill directory:

  **Let your AI Agent install it with one sentence** (recommended): copy the version matching your tool:

  - **OpenCode**:
    > Please install the easyeda-api skill from <https://github.com/easyeda/easyeda-api-skill> into OpenCode's global Skill directory.

  - **Claude Code**:
    > Please install the easyeda-api skill from <https://github.com/easyeda/easyeda-api-skill> into Claude Code's global Skill directory.

  - **Cursor / Cline / Continue / Windsurf / WorkBuddy / QwenCode / KimiCode / Trae**:
    > Please download and install the easyeda-api skill from <https://github.com/easyeda/easyeda-api-skill>.

  **Manual download and unzip**: if you don't have an AI Agent at hand, download the zip and unzip it into the global Skill directory:
  - Download: <https://image.lceda.cn/files/easyeda-api-skill.zip>
  - Unzip target: `~/.config/opencode/skills/easyeda-api/` (OpenCode path; for other tools, see your tool's docs for its global skills directory)
  - For full steps, see [FAQ.en.md § 5.2](./FAQ.en.md#52-manual-install-if-the-command-fails)

  Advanced users can also use the `npx clawhub@latest install ...` command-line method — see [FAQ.en.md § 5.1](./FAQ.en.md#51-one-line-install-via-clawhub).
4. Start your AI tool:
  - **OpenCode / Claude Code / QwenCode / KimiCode**: in the terminal, run `opencode` / `claude` / `qwencode` / `kimi` (or the matching command)
  - **Cursor / Windsurf / Trae / WorkBuddy**: double-click the desktop icon
  - **Cline / Continue**: open VS Code
5. On first use, follow the in-tool prompts to log in or pick a model. In OpenCode you can run `/connect` to choose a free model.
6. Install the **Run API Gateway** extension in EasyEDA Pro, and make sure both **Allow External Interaction** and **Show in Top Menu** are enabled in the Extension Manager.
7. Open EasyEDA and confirm the **API Gateway** menu appears at the top.
8. Return to your AI tool and trigger it with `/easyeda-api skill ...`, for example:
  - `Use /easyeda-api skill to inspect my current schematic.`
  - `Use /easyeda-api skill to draw a NE555 minimal circuit.`

If this is your first time with these tools, please read the "From-Scratch Tutorial" section in [FAQ.md](./FAQ.md) for a full step-by-step walkthrough.

## Menu Operations

| Menu Item | Description |
|-----------|-------------|
| **Reconnect** | Manually re-scan ports and connect to the Bridge Server. |
| **Stop Connection** | Disconnect the current session. |
| **Toggle Auto-Connect Status** | Toggle the auto-connect switch. |
| **About...** | Show the extension version and current connection status. |

## Advanced Topics

For connection failures, prompt examples, component responsibilities, and developer-mode debugging, see:

- [FAQ 简体中文](./FAQ.md) — Detailed environment prep, installation steps, troubleshooting and examples
- [FAQ English](./FAQ.en.md) — Detailed setup, troubleshooting and examples

You can also read them directly on GitHub:

- <https://github.com/easyeda/eext-run-api-gateway/blob/main/FAQ.md>
- <https://github.com/easyeda/eext-run-api-gateway/blob/main/FAQ.en.md>

## License

This extension is licensed under the [Apache License 2.0](https://choosealicense.com/licenses/apache-2.0/).
