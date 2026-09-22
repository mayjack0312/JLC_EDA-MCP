# Run API Gateway — FAQ

[简体中文](./FAQ.md) · [Gateway README](./README.en.md) · [JLC_EDA-MCP README](../README.en.md)

This document describes the **current JLC_EDA-MCP v2.0 integrated workflow only**. The legacy easyeda-api Skill, ClawHub, Skill ZIP download, and OpenCode-specific installation flow are no longer recommended by this repository.

## 1. What do I actually need to install?

Only three pieces are required:

1. **JLC_EDA-MCP v2.0** — the MCP server at the repository root;
2. **Run API Gateway v1.0.6** — `run-api-gateway_v1.0.6.eext` bundled in this directory;
3. **An MCP-capable client / agent** — configured to launch or connect to the root MCP server.

You do not need an extra easyeda-api Skill or a second Bridge Server.

## 2. What is the correct data path?

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

## 3. Why is the Gateway still needed?

The MCP server runs in Node.js, while the official `eda.*` APIs live in the EasyEDA Pro page runtime.

The Gateway connects those environments by:

- connecting to the local bridge;
- executing requests in EasyEDA page context;
- returning results / errors to the MCP server;
- registering a separate `windowId` for each EasyEDA window;
- maintaining heartbeat and reconnect behavior.

## 4. Where does the Gateway connect?

It scans only:

```text
127.0.0.1:49620-49629
```

WebSocket path:

```text
/eda
```

Full form:

```text
ws://127.0.0.1:<port>/eda
```

The Gateway verifies:

```text
service = easyeda-bridge
```

in the handshake.

## 5. How do I know the connection is working?

Call:

```text
easyeda_bridge_status
```

Check:

- `count`
- `activeWindowId`
- `windows`

If `count > 0`, at least one EasyEDA window is connected.

## 6. What if `count: 0`?

Check in this order:

1. JLC_EDA-MCP is running;
2. EasyEDA Pro is running;
3. the Gateway extension is enabled;
4. external-interaction / WebSocket permission is allowed;
5. click **API Gateway → Reconnect**;
6. check for port conflicts on `49620-49629`;
7. check endpoint security, proxy, or antivirus software for loopback WebSocket blocking.

Windows PowerShell:

```powershell
Get-NetTCPConnection -LocalPort 49620,49621,49622,49623,49624,49625,49626,49627,49628,49629 -ErrorAction SilentlyContinue
```

See [../docs/TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md) for the full checklist.

## 7. Why are there 760 direct tools?

The current API catalog is generated from:

```text
@jlceda/pro-api-types 0.4.23
```

It contains:

- 98 root namespaces
- 760 deduplicated public methods

Full mode registers those 760 methods as direct tools.

## 8. Why is the total 769?

Full mode:

```text
760 direct API tools
+ 6 API management / connection tools
+ 3 extension development / debugging tools
= 769
```

See [../docs/COVERAGE_REPORT.md](../docs/COVERAGE_REPORT.md).

## 9. What if my client cannot handle that many tools?

Use Compact mode:

```powershell
$env:EASYEDA_TOOL_PROFILE="compact"
npm start
```

Compact mode does not register the 760 direct tools, but API coverage stays the same.

Recommended flow:

```text
easyeda_api_search
    ↓
easyeda_api_describe
    ↓
easyeda_api_call
```

## 10. How should I discover an API?

If you do not know the exact project API name:

1. search for `project` with `easyeda_api_search`;
2. pick a candidate;
3. inspect it with `easyeda_api_describe`;
4. call it with `easyeda_api_call`.

Do not guess method names or argument layouts.

## 11. How are multiple windows handled?

Every EasyEDA page window registers a separate `windowId`.

First call:

```text
easyeda_bridge_status
```

Then use:

```text
easyeda_select_window
```

or pass an explicit `windowId` where supported.

## 12. What do the Gateway menu items do?

| Menu | Purpose |
|---|---|
| **Reconnect** | Cancel the current connection flow and scan again |
| **Stop Connection** | Stop connection, heartbeat, and retries |
| **Toggle Auto-Connect Status** | Change startup auto-connect behavior |
| **About...** | Show version and current connection status |

## 13. Does the Gateway reconnect automatically?

Yes.

After a successful connection it sends periodic heartbeats. If heartbeat or send fails, it clears the session and scans again.

If no bridge is found, the internal retry policy runs until that retry cycle reaches its maximum; **Reconnect** starts a new connection cycle.

## 14. Why can an API call still fail?

Common reasons include:

- wrong argument count;
- non-JSON-safe values;
- APIs that require callbacks, browser objects, File / Blob, or other objects that cannot be passed directly through MCP JSON;
- the current editor / project state does not satisfy the API precondition;
- version-, permission-, or context-dependent APIs;
- timeout.

“760 / 760 generated” means all public methods from the current official type definitions are included in the catalog / allowlist / tool-generation pipeline. It does not mean every method must succeed in every runtime state with arbitrary arguments.

## 15. What if calls time out?

The root server supports:

```text
EASYEDA_API_TIMEOUT_MS
```

Before increasing it, determine whether:

- the Gateway is disconnected;
- the API itself is slow;
- the API expects unsupported interaction;
- the current EasyEDA state does not satisfy the call.

Avoid simply making the timeout unlimited.

## 16. Can the Gateway connect to a LAN bridge?

That is not the current JLC_EDA-MCP integration design.

The bridge binds to loopback and the Gateway scans `127.0.0.1`. This is part of the current trust boundary.

## 17. Where did the old easyeda-api Skill instructions go?

This repository no longer maintains that installation tutorial.

JLC_EDA-MCP now directly provides:

- MCP server
- bridge
- API catalog
- tool generation
- search / describe / call tools
- multi-window management

Keeping the old Skill / ClawHub / ZIP install steps in the active docs made them look like required JLC_EDA-MCP dependencies.

If you specifically need the official upstream Gateway's standalone Skill workflow, use that upstream project's own documentation.

## 18. How do I develop the Gateway locally / use Debug hot reload?

The bundled-gateway development framework is aligned with official **pro-api-sdk v1.6.27**.

From this directory:

```bash
cd bundled-gateway
npm install
npm run lint
npm run build
```

Production `.eext` output is written under `build/dist/`.

For the official Debug hot-reload flow, run:

```bash
npm run debug
```

This starts the official SDK `build/dev.ts` flow:

- Debug WebSocket: `ws://localhost:59394`
- initial esbuild and packaging
- continuous source watching
- 300 ms debounce after successful rebuilds
- automatic `.eext` repackaging
- push of the updated package to connected EasyEDA Pro official Debug clients

The live Debug package is maintained under the subproject `dist/` directory.

Port `59394` is only for SDK hot reload. It is separate from the JLC_EDA-MCP API bridge on `49620-49629`.

SDK framework maintenance commands:

```bash
npm run update:check
npm run update
npm run manifest:generate
npm run manifest:bump
```

This subproject has no standalone test framework, so Gateway changes should at minimum pass lint and build and be validated with a real EasyEDA Pro connection; hot-reload changes should also be verified with `npm run debug`.

## 19. More documentation

- [API Usage](../docs/API_USAGE.md)
- [Architecture](../docs/ARCHITECTURE.md)
- [Coverage Report](../docs/COVERAGE_REPORT.md)
- [Troubleshooting](../docs/TROUBLESHOOTING.md)
- [Development Guidelines](./AGENTS.md)
