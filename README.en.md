English | [中文](./README.md)

# JLC_EDA-MCP — Complete EasyEDA Pro MCP

A complete MCP service for JLCEDA / EasyEDA Pro. It extends the official extension-development MCP with automatically generated access to every public API method exposed from the `EDA` root object in the currently pinned `@jlceda/pro-api-types` package, while preserving plugin import, debugging, and browser-console tooling.

## v2.0 Coverage

- 98 official API namespaces
- 760 public API methods, each available as a generated direct MCP tool
- 6 API management / connection tools
- 3 extension-development tools: `import_plugin`, `dev_plugin`, `get_console_logs`
- 769 MCP tools in Full mode
- Embedded localhost-only WebSocket Bridge; no separate bridge process required
- Bundled official `bundled-gateway/run-api-gateway_v1.0.6.eext`
- bundled-gateway development framework aligned across the official `pro-api-sdk` v1.6.27 feature set: Debug hot reload, SDK updater, project creator, manifest tooling, ESM/Bundler, compressed packaging, and template resources
- Full and Compact tool profiles

See [`docs/COVERAGE_REPORT.md`](docs/COVERAGE_REPORT.md) for coverage details and [`docs/API_USAGE.md`](docs/API_USAGE.md) for API usage.

## Quick Start

### 1. Requirements

- Node.js 20.17.0+
- Google Chrome or Microsoft Edge for plugin import / browser console features
- JLCEDA / EasyEDA Pro

### 2. Clone and build

~~~bash
git clone https://github.com/mayjack0312/JLC_EDA-MCP.git
cd JLC_EDA-MCP
npm install
npm run build
npm test
~~~

On Windows you can also run `START_MCP_WINDOWS.bat`. It installs dependencies when missing and rebuilds before every launch so `dist` stays synchronized with the current source, then starts the MCP server.

### 3. Install the EasyEDA API Gateway

Import the following extension into EasyEDA Pro:

`bundled-gateway/run-api-gateway_v1.0.6.eext`

Allow the required WebSocket / external-interaction permissions. The embedded bridge binds only to `127.0.0.1` and selects an available port from `49620-49629`.

### 4. Generate MCP configuration

~~~bash
npm run mcp-config
~~~

This creates `mcp-config.json` and `opencode.json` in the repository root, using `jlc-eda-mcp` as the default MCP server ID. Import the appropriate configuration into your AI Agent / MCP client and restart it.

> The generated configuration does not auto-approve all 760 EasyEDA API tools. High-permission auto-approval remains a client-side decision.

### 5. Verify the bridge

Call `easyeda_bridge_status`. When `count > 0` and at least one EasyEDA window is connected, official API calls are ready. Use `easyeda_select_window` when multiple windows are connected.

## API Access

### Full mode (default)

With `EASYEDA_TOOL_PROFILE=all` (the default), every public SDK method is registered as its own MCP tool:

`eda_<namespace>_<method>`

Generated direct tools accept:

- `args`: JSON arguments in official signature order
- `windowId`: optional target EasyEDA window ID

Full mode is best for MCP clients that can handle a large `tools/list` response.

### Compact mode

For clients that cannot reliably handle 760 direct tools, set:

~~~text
EASYEDA_TOOL_PROFILE=compact
~~~

All official APIs remain available through:

~~~text
easyeda_api_search
        ↓
easyeda_api_describe
        ↓
easyeda_api_call
~~~

For example, search for project information, inspect the full signature of `dmt_Project.getCurrentProjectInfo`, then invoke it with `easyeda_api_call`.

## API Management Tools

| Tool | Purpose |
|---|---|
| `easyeda_bridge_status` | Show bridge state and connected EasyEDA windows |
| `easyeda_select_window` | Select the active EasyEDA window for subsequent calls |
| `easyeda_api_catalog` | Show API type version, namespace count and method count |
| `easyeda_api_search` | Search official APIs by name, namespace, description or parameter type |
| `easyeda_api_describe` | Return a method's full signature, parameters, overloads and deprecation state |
| `easyeda_api_call` | Invoke any allowlisted method from the generated API catalog |

## Extension Development Tools

| Tool | Purpose |
|---|---|
| `import_plugin` | Import an `.eext` extension and start browser console listening |
| `dev_plugin` | Import an extension and watch for browser errors |
| `get_console_logs` | Retrieve browser console logs; can be called independently, with filtering, count limiting and cache clearing |

`get_console_logs` no longer requires a previous `import_plugin` or `dev_plugin` call. If no listener exists, it connects to the browser and starts listening automatically.


### Official SDK Debug Hot Reload

The `bundled-gateway` development framework is aligned with official `pro-api-sdk` v1.6.27. To use the official EasyEDA extension Debug hot-reload path:

~~~bash
cd bundled-gateway
npm install
npm run debug
~~~

This starts the official SDK Debug server at `ws://localhost:59394`, watches source changes, rebuilds incrementally, repackages automatically, and pushes the new `.eext` to connected EasyEDA Pro official Debug clients.

> Port `59394` is dedicated to SDK hot reload; the JLC_EDA-MCP API bridge continues to use `127.0.0.1:49620-49629`.

## Architecture

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
Official EDA.* EasyEDA Pro APIs
~~~

The API catalog is generated from `@jlceda/pro-api-types`; the project does not manually maintain 760 tool definitions. Unified calls only accept allowlisted `namespace.method` identifiers and JSON-serializable arguments.

## Updating the Official SDK

The repository currently pins `@jlceda/pro-api-types` 0.4.23. After changing that version, run:

~~~bash
npm install
npm run build
npm test
~~~

The build regenerates the API catalog; the smoke test verifies tool counts, uniqueness, and required management tools.

## Environment Variables

| Variable | Meaning | Default |
|---|---|---|
| `EASYEDA_TOOL_PROFILE` | `all` exposes all generated API tools; `compact` uses discovery + unified calls | `all` |
| `EASYEDA_API_TIMEOUT_MS` | Timeout for one EasyEDA API call | `30000` |
| `CHROME_PATH` | Explicit Chrome / Chromium / Edge executable path | auto-detect |

## Documentation

- [`docs/API_USAGE.md`](docs/API_USAGE.md) — API discovery, descriptions, calls, multi-window use, Full / Compact modes
- [`docs/COVERAGE_REPORT.md`](docs/COVERAGE_REPORT.md) — official API coverage and safety boundaries
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — bridge, generated catalog, execution path, and security design
- [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) — gateway, connection, timeout, large tool lists, browser log issues
- [`docs/SDK_ALIGNMENT.md`](docs/SDK_ALIGNMENT.md) — official pro-api-sdk v1.6.27 feature/file alignment matrix

## Coverage Note

“100% API coverage” means every public class method exposed from the `EDA` root object in the pinned official type definitions is included in the generated catalog, the unified-call allowlist, and the generated direct tools. It does not mean every API is remotely executable with JSON-only parameters. Methods requiring callbacks, browser-native objects, `File` / `Blob`, specific editor states, versions, or permissions remain subject to the real EasyEDA Pro runtime.

This project extends the EasyEDA official `extension-dev-mcp-tools` development/debugging workflow. See `LICENSE` and `NOTICE.txt` for licensing and attribution.
