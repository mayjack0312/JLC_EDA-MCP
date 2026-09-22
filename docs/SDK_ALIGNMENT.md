# Official pro-api-sdk Alignment

Current bundled Gateway development baseline: **easyeda/pro-api-sdk v1.6.27**  
Runtime extension version: **Run API Gateway v1.0.6**

These are separate version tracks: the SDK version describes the extension-development toolchain, while v1.0.6 describes the Gateway extension itself.

## Functional alignment

| Official SDK capability | Introduced upstream | JLC_EDA-MCP bundled-gateway |
|---|---:|---|
| TypeScript + esbuild production build | 1.0.x | ✅ |
| Header-menu localization infrastructure | 1.1.0 | ✅ existing Gateway locales retained |
| ESLint-based formatting / lint flow | 1.2.0 | ✅ |
| Compressed EEXT packaging | 1.2.0 | ✅ official `build/utils.ts`, DEFLATE level 9 |
| Online Debug / hot reload | 1.4.0 | ✅ `npm run debug`, `build/dev.ts`, port 59394 |
| SDK framework self-update | 1.5.0 | ✅ `npm run update:check` / `npm run update` |
| Project creation CLI | 1.6.0 | ✅ official `build/create.js` and package `bin` entry |
| ESM project mode | 1.6.0 | ✅ `"type": "module"` |
| Bundler module resolution | current 1.6.27 | ✅ official `tsconfig.json` |
| SDK manifest generation | current 1.6.27 | ✅ `manifest:generate` / `manifest:bump` |
| Official iframe template resource | current 1.6.27 | ✅ `iframe/index.html` |
| Official template logo resource | current 1.6.27 | ✅ `images/logo.png` |
| Creator/update exclusion fixes | 1.6.1 / 1.6.2 | ✅ official files copied byte-for-byte |

## Files kept identical to upstream

The following functional/toolchain files are intentionally kept byte-identical to the current official `easyeda/pro-api-sdk` master baseline used for v1.6.27:

- `.sdk-manifest.json`
- `build/create.js`
- `build/dev.ts`
- `build/dist/.gitignore`
- `build/manifest.ts`
- `build/packaged.ts`
- `build/update.ts`
- `build/utils.ts`
- `config/esbuild.common.ts`
- `config/esbuild.prod.ts`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `iframe/index.html`
- `images/logo.png`

The standard editor/repository support files that are shared with upstream are also retained where applicable.

## Intentional project-specific differences

The following files must **not** be overwritten by the official demo/template because they implement JLC_EDA-MCP / Run API Gateway behavior:

- `src/index.ts` — Gateway port scan, handshake, window registration, execution, heartbeat/reconnect
- `extension.json` — Run API Gateway v1.0.6 identity, menus, activation and permissions
- `locales/*` — Gateway UI strings
- `.edaignore` — additionally excludes repository docs, SDK metadata and `*.eext` to prevent nested hot-reload packages
- `eslint.config.mjs` — official rule baseline plus repository-specific ignore / console allowances
- `README*.md`, `FAQ*.md`, `CHANGELOG.md`, `AGENTS.md` — JLC_EDA-MCP integration documentation

The official Japanese, Russian and Traditional Chinese SDK README files are not copied into the bundled Gateway because they document the generic upstream template/Skill workflow rather than this repository's integrated runtime. This is a documentation difference, not a missing SDK function.

## Debug and API ports

Do not conflate the two localhost channels:

- `ws://localhost:59394` — official pro-api-sdk Debug hot-reload channel
- `127.0.0.1:49620-49629` — JLC_EDA-MCP API Bridge used by Run API Gateway

## Upgrade procedure

When upstream pro-api-sdk advances beyond v1.6.27:

1. inspect the upstream CHANGELOG and tree;
2. compare all SDK/toolchain files, not only `build/dev.ts`;
3. update the upstream framework files and dependencies;
4. preserve the project-specific files listed above;
5. run `npm install`, `npm run lint`, `npm run build`, and `npm run debug` from `bundled-gateway`;
6. rebuild the checked-in `run-api-gateway_v1.0.6.eext`;
7. verify that the package does not contain a nested `.eext`;
8. update this alignment document.
