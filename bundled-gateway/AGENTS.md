# AGENTS.md — Coding Guidelines for AI Agents

> **Project**: EasyEDA Pro Extension — WebSocket API Gateway
> **Purpose**: Bridge between AI coding tools (Claude Code, OpenCode, etc.) and EasyEDA Pro desktop client.
> **Repository role**: In `mayjack0312/JLC_EDA-MCP`, this subproject is the bundled EasyEDA runtime Gateway used by the root JLC_EDA-MCP v2.0 server. The root server owns MCP stdio, API catalog/tool registration, window selection, and the localhost Bridge; this subproject owns EasyEDA-side port scanning, handshake, window registration, heartbeat/reconnect, and execution inside the EDA page runtime.
>
> **Integration constraint**: Preserve compatibility with the official Run API Gateway v1.0.6 runtime behavior. Active repository documentation targets the JLC_EDA-MCP integrated workflow; do not reintroduce legacy Skill / ClawHub install instructions or package obsolete tutorial screenshots. Do not introduce MCP-specific tool registration into this subproject; that belongs in the repository root.

---

## MCP Debug Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install Debug helper dependencies (Node >=20.17.0) |
| `npm run lint` | Check Gateway / Debug helper source |
| `npm run fix` | ESLint auto-fix |
| `npm run debug` | Official v1.6.27-compatible hot reload: watch + temporary EEXT + WebSocket push on port 59394 |

The MCP repository is **not** an SDK template or extension publishing pipeline. Do not add SDK create/update/manifest/release tooling unless it becomes necessary for MCP connectivity or debugging.

---

## Project Structure

```
src/
  index.ts          # Single entry point — all extension logic lives here
build/
  dev.ts            # Official-compatible Debug hot-reload server on localhost:59394
  utils.ts          # Helpers required by Debug temporary EEXT packaging
config/
  esbuild.common.ts # Shared esbuild config required by Debug mode
extension.json      # EasyEDA Gateway manifest (runtime business config)
```

**Key constraint**: Source is a single `src/index.ts`. The esbuild config bundles to IIFE format for the EasyEDA runtime. Do not add separate entry points without updating `config/esbuild.common.ts`.

---

## Code Style

### Formatting (enforced by ESLint + EditorConfig)

- **Indentation**: Tabs (not spaces)
- **Quotes**: Single quotes (`'string'`)
- **Semicolons**: Always
- **Line endings**: LF (Unix)
- **Trailing commas**: Yes (ES5 style)

### Imports

```typescript
// ✅ Node built-ins with node: prefix
import path from 'node:path';
import process from 'node:process';

// ✅ External packages
import fs from 'fs-extra';
import JSZip from 'jszip';

// ✅ Runtime source may use the existing namespace JSON import through esbuild
import * as extensionConfig from '../extension.json';

// ✅ Node-side SDK build scripts use ESM JSON import attributes
import extensionConfig from '../extension.json' with { type: 'json' };

// ❌ Avoid: import * as fs from 'node:fs' — use default import for fs-extra
```

### TypeScript

- **Strict mode enabled**: `strict`, `strictNullChecks`, `noImplicitAny`, `useUnknownInCatchVariables` are all ON
- **Target**: ESNext with DOM lib
- **Module**: ESNext with Bundler resolution (official SDK v1.6.27 baseline)
- **Types**: Prefer explicit types for function params/returns; avoid `any`
- **Interfaces**: Define at module level for message types (see `BridgeMessage`)

```typescript
// ✅ Explicit interface for message types
interface BridgeMessage {
	type: 'execute' | 'ping' | 'pong' | 'handshake' | 'result' | 'error';
	id?: string;
	// ...
}

// ✅ Type guard with assertion
function testUuid(uuid?: string): uuid is string { /* ... */ }

// ❌ Avoid: @ts-expect-error, as any, @ts-ignore
```

### Naming

| Element | Convention | Example |
|---------|------------|---------|
| Constants (module-level) | `SCREAMING_SNAKE_CASE` | `PORT_START`, `HEARTBEAT_INTERVAL_MS` |
| Variables | `camelCase` | `currentPort`, `handshakeVerified` |
| Functions | `camelCase` | `scanAndConnect`, `tryConnectToPort` |
| Interfaces | `PascalCase` | `BridgeMessage` |
| Timers | `camelCase` + type suffix | `retryTimer`, `heartbeatTimer` |

### Error Handling

```typescript
// ✅ Catch with typed error (useUnknownInCatchVariables is on)
catch (err: unknown) {
	console.error('[API-Gateway] Failed:', err instanceof Error ? err.message : String(err));
}

// ✅ Silent catch when cleanup is best-effort
try {
	eda.sys_WebSocket.close(WS_ID);
}
catch { /* ignore */ }

// ❌ Avoid: empty catch blocks without comment
catch {}
```

### Comments

- Use `// ─── Section Headers ───` for logical sections
- JSDoc for exported functions and complex internal functions
- Inline comments in Chinese are acceptable (team convention)

---

## Pre-commit Hooks

- **simple-git-hooks** + **lint-staged** configured
- On commit: `eslint --fix` runs on all staged files
- Do NOT bypass hooks unless explicitly requested

---

## Architecture Notes

### EasyEDA Runtime APIs

The extension runs inside EasyEDA's browser-like environment. Key globals:
- `eda.sys_WebSocket` — WebSocket management (`register`, `send`, `close`)
- `eda.sys_Message` — Toast notifications (`showToastMessage`)
- `eda.sys_I18n` — Internationalization (`text`)
- `eda.sys_Dialog` — Dialogs (`showInformationMessage`)

**These are NOT browser APIs.** They are EasyEDA-internal. Do not attempt to polyfill or replace with standard WebSocket.

### Extension Lifecycle

- `activate()` → called on startup (`onStartupFinished` event)
- `deactivate()` → called on extension unload (cleanup)
- Menu functions (`reconnect`, `about`) → exported and registered via `extension.json`

---

## Common Pitfalls

1. **Do not add test files** — no test runner configured. Use `npm run lint` + `npm run build` for validation.
2. **Do not change bundle format** — IIFE format is required by EasyEDA extension loader.
3. **Do not use browser `fetch` for HTTP** — EasyEDA webview enforces mixed-content blocking. Use WebSocket only.
4. **JSON import must use namespace import** — `import * as config from '../extension.json'` (not default import).
5. **Pre-commit lint is enforced** — `npm run fix` before committing to avoid hook failures.
6. **Do not conflate ports** — SDK hot reload uses `localhost:59394`; the JLC_EDA-MCP API Bridge uses `127.0.0.1:49620-49629`.
7. **Keep SDK scope narrow** — only mirror upstream files required for MCP connection/debug behavior. Do not chase byte-for-byte SDK template parity.

---

## When Making Changes

1. Edit `src/index.ts` for Gateway runtime changes.
2. Run `npm run lint`.
3. For hot-reload changes, run `npm run debug` and verify the EasyEDA Pro official Debug client connects to port 59394.
4. Do not add release/build/template tooling merely because it exists in pro-api-sdk.

**Keep changes minimal and focused.** This is a small, single-purpose extension.
