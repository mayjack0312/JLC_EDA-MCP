# Run API Gateway

[简体中文](./README.md) · [FAQ 简体中文](./FAQ.md) · [FAQ English](./FAQ.en.md)

EasyEDA Pro extension used to connect the running EasyEDA Pro page runtime to the local bridge embedded in **JLC_EDA-MCP v2.0**.

> **Recommended workflow for this repository**
>
> When using `mayjack0312/JLC_EDA-MCP`, you **do not need to install the easyeda-api Skill, use ClawHub, or start a second Bridge Server**.
> The repository root already provides the MCP server, bridge, API catalog, Full / Compact profiles, and MCP access to all 760 currently cataloged public EasyEDA Pro APIs.

## Architecture

```text
AI Agent / MCP Client
        │ MCP stdio
        ▼
JLC_EDA-MCP v2.0
        │ embedded easyeda-bridge
        │ 127.0.0.1:49620-49629
        ▼
Run API Gateway v1.0.6
        │ EasyEDA page runtime
        ▼
Official EasyEDA Pro EDA.* APIs
```

JLC_EDA-MCP currently generates from `@jlceda/pro-api-types` 0.4.23:

- 98 EDA root namespaces
- 760 public API methods
- 760 direct API tools in Full mode
- 6 API management / connection tools
- 3 extension development / debugging tools
- 769 MCP tools total in Full mode

The Gateway does not own those 760 MCP tools. Its EasyEDA-side responsibilities are:

- discover and connect to the local bridge
- verify the `service: "easyeda-bridge"` handshake
- register a unique `windowId` for each EasyEDA window
- execute bridge requests inside the EasyEDA page runtime
- return results or errors
- maintain heartbeat and reconnect after disconnects

## Quick Start

### 1. Build and start JLC_EDA-MCP

From the repository root:

```bash
npm install
npm run build
npm test
npm start
```

On Windows you can also run:

```text
START_MCP_WINDOWS.bat
```

### 2. Install the bundled Gateway in EasyEDA Pro

Import:

```text
bundled-gateway/run-api-gateway_v1.0.6.eext
```

Enable the extension and allow the required WebSocket / external-interaction capability.

A successful load exposes the **API Gateway** menu in EasyEDA Pro.

### 3. Verify the connection

Call:

```text
easyeda_bridge_status
```

When `count > 0`, at least one EasyEDA window is registered with the bridge.

The recommended API workflow is:

```text
easyeda_api_search
    ↓
easyeda_api_describe
    ↓
easyeda_api_call
```

In Full mode you may also invoke generated direct tools:

```text
eda_<namespace>_<method>
```

A full method ID may look like:

```text
dmt_Project.getCurrentProjectInfo
```

## Official SDK 1.6.27 Debug Hot Reload

The development framework in this directory is aligned with the official `easyeda/pro-api-sdk` **v1.6.27**. The runtime extension remains **Run API Gateway v1.0.6**; the SDK baseline and extension version are separate version tracks.

Install the subproject dependencies:

```bash
cd bundled-gateway
npm install
```

Start the official Debug hot-reload flow:

```bash
npm run debug
```

The official `build/dev.ts` will:

1. start a Debug WebSocket server at `ws://localhost:59394`;
2. perform the initial esbuild of `src/index.ts`;
3. package the current `.eext`;
4. watch source files for changes;
5. debounce successful rebuilds for 300 ms;
6. repackage automatically; and
7. push the updated `.eext` as Base64 to connected EasyEDA Pro Debug clients.

```text
source edit
  ↓
esbuild watch
  ↓
repackage .eext
  ↓
ws://localhost:59394
  ↓
EasyEDA Pro official Debug / hot-reload client
```

**Port 59394 is the official SDK Debug hot-reload channel, not the JLC_EDA-MCP API bridge.** Normal MCP/API traffic still uses `127.0.0.1:49620-49629`.

The latest SDK tooling also provides:

```bash
npm run compile
npm run lint
npm run fix
npm run build
npm run debug
npm run update:check
npm run update
npm run manifest:generate
npm run manifest:bump
```

The official v1.6.x project creator (`build/create.js` / package `bin` entry), ESM mode, Bundler module resolution, compressed packaging, `iframe/index.html`, and `images/logo.png` template resources are also synchronized. See [../docs/SDK_ALIGNMENT.md](../docs/SDK_ALIGNMENT.md) for the full alignment matrix.

`.sdk-manifest.json` records the official SDK framework version and SHA-256 values of framework files. Project-specific `src/index.ts` and `extension.json` remain owned by JLC_EDA-MCP / Run API Gateway and are not replaced by the official demo.

## Full and Compact Profiles

### Full

Default mode. Registers 760 direct API tools and is appropriate when the MCP client can handle a large `tools/list`.

### Compact

If the client has tool-count limits, large context overhead, or `tools/list` timeouts, set:

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

Compact mode does not register the 760 direct tools, but the complete catalog remains available through:

- `easyeda_api_catalog`
- `easyeda_api_search`
- `easyeda_api_describe`
- `easyeda_api_call`

## Multiple EasyEDA Windows

Every connected EasyEDA window receives its own `windowId`.

When several EasyEDA windows are open, use:

```text
easyeda_bridge_status
easyeda_select_window
```

or pass an explicit `windowId` on supported API calls.

## Connection Protocol

The Gateway scans:

```text
127.0.0.1:49620
...
127.0.0.1:49629
```

and connects to:

```text
ws://127.0.0.1:<port>/eda
```

A valid connection must receive:

```json
{
  "type": "handshake",
  "service": "easyeda-bridge"
}
```

The Gateway then creates a random `windowId` and registers it with the bridge.

Heartbeat monitoring is built in. When the connection is lost, the old session is closed and the Gateway scans again.

## Menu

| Menu item | Purpose |
|---|---|
| **Reconnect** | Re-scan ports and reconnect |
| **Stop Connection** | Stop the current connection and retry loop |
| **Toggle Auto-Connect Status** | Enable / disable startup auto-connect |
| **About...** | Show version, port, and window connection status |

## Common Problems

### `easyeda_bridge_status` returns `count: 0`

Check, in order:

1. the repository-root JLC_EDA-MCP process is running;
2. EasyEDA Pro is running;
3. `run-api-gateway_v1.0.6.eext` is enabled;
4. the extension has external-interaction / WebSocket permission;
5. local security software is not blocking loopback WebSockets;
6. ports `49620-49629` are not occupied by unrelated processes.

See [FAQ.en.md](./FAQ.en.md) and [../docs/TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md) for details.

### Too many tools

Use Compact mode.

### Calls target the wrong window

Inspect windows with `easyeda_bridge_status`, then use `easyeda_select_window`.

## Upstream Compatibility

This bundled component is based on the official Run API Gateway v1.0.6 and retains its standalone runtime capability.

However, **the JLC_EDA-MCP repository documentation no longer recommends or maintains the legacy easyeda-api Skill / ClawHub installation workflow**. If you specifically need the official upstream standalone Skill workflow, consult that upstream project's own documentation and do not mix it with the JLC_EDA-MCP integrated workflow.

## Further Reading

- [JLC_EDA-MCP README](../README.en.md)
- [API Usage](../docs/API_USAGE.md)
- [Architecture](../docs/ARCHITECTURE.md)
- [API Coverage](../docs/COVERAGE_REPORT.md)
- [Troubleshooting](../docs/TROUBLESHOOTING.md)
- [Gateway FAQ](./FAQ.en.md)
- [Development Guidelines](./AGENTS.md)

## License

This bundled extension remains covered by the Apache License 2.0 included in the repository.
