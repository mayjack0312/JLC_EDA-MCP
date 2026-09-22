# JLC_EDA-MCP SDK framework alignment — 2026-09-22

> Run API Gateway runtime remains **v1.0.6**. The bundled development framework is now aligned with official **pro-api-sdk v1.6.27**.

1. Add the official `npm run debug` hot-reload flow using `build/dev.ts` and `ws://localhost:59394`.
2. Add official shared packaging helpers in `build/utils.ts` and update `build/packaged.ts`.
3. Add official SDK framework update commands: `update:check` and `update`.
4. Add SDK manifest generation/version-bump support and `.sdk-manifest.json`.
5. Add the official project creator entry and update the package to ESM / Bundler-resolution tooling.
6. Update `@jlceda/pro-api-types` to the official v1.6.27 SDK baseline (`^0.4.23`) and add the WebSocket development dependency.
7. Preserve the JLC_EDA-MCP-specific Gateway runtime source, extension manifest, integration documentation, and loopback API bridge behavior.
8. Add the remaining official functional/template resources (`iframe/index.html`, `images/logo.png`) and publish an explicit SDK alignment matrix.

# JLC_EDA-MCP documentation cleanup — 2026-09-22

> Documentation-only change. The bundled extension artifact remains **Run API Gateway v1.0.6**.

1. Remove legacy easyeda-api Skill / ClawHub / ZIP-install instructions from the active README and FAQ.
2. Remove old upstream download and documentation URLs from the active JLC_EDA-MCP documentation path.
3. Make JLC_EDA-MCP v2.0 the single recommended workflow in this repository.
4. Keep only a short compatibility note for users who intentionally use the upstream standalone Gateway workflow.
5. Rewrite the FAQ around current bridge status, Full / Compact profiles, multi-window handling, API discovery, timeouts, and troubleshooting.
6. Remove obsolete `images/readme/*` tutorial screenshots from the repository and future extension packages.
7. Rebuild the bundled `.eext` so its embedded README / FAQ match the active JLC_EDA-MCP documentation.

# JLC_EDA-MCP repository integration — 2026-09-22

> Documentation-only integration note. The bundled extension artifact remains official **Run API Gateway v1.0.6**; no extension runtime version was changed.

1. Clarify that this directory is the EasyEDA runtime Gateway bundled with JLC_EDA-MCP v2.0.
2. Add the JLC_EDA-MCP architecture: MCP stdio → embedded localhost Bridge → Run API Gateway → EasyEDA Pro `EDA.*`.
3. Document ports `127.0.0.1:49620-49629`, handshake service `easyeda-bridge`, per-window `windowId`, and multi-window selection.
4. Clarify that JLC_EDA-MCP integrated mode does **not** require a separate easyeda-api Skill or separately launched Bridge Server.
5. Point standalone upstream users to the upstream project's own documentation instead of duplicating its legacy install flow here.
6. Add links back to the repository-root API usage and troubleshooting documentation.

# 1.0.6

1. 拆分文档为 README.md / README.en.md / FAQ.md / FAQ.en.md，README 只留快速路径，FAQ 留所有排查细节
2. README 新增「让 AI Agent 一句话代为安装 easyeda-api Skill」入口（含 easyeda-api-skill GitHub 链接）
3. README 新增手动下载 zip 安装方式（备用入口）
4. README 工具列表扩展：增加 Cursor / Cline / Continue / Windsurf / WorkBuddy / Trae
5. README 去除硬编码 OpenCode，第 2、4 步按工具类型分组列出安装/启动方式
6. 快速开始第 8 步示例从「嘉立创EDA，启动！」改为可操作的 `/easyeda-api skill` 调用示例
7. FAQ § 5.1 收录 PowerShell / Windows cmd / macOS-Linux 三种命令行安装命令（原 README 命令迁入）
8. FAQ § 11 新增 11.7 网络代理与 11.8 端口冲突排查

# 1.0.5

1. 增加 cmd 命令的文档

# 1.0.4

1. 新增 Skill 手动安装方式，并提供中国大陆用户优化的直接下载地址

# 1.0.3

1. 修正 README ASCII 格式

# 1.0.2

1. 提供完整新用户初始化使用指南

# 1.0.1

1. 优化配置路径

# 1.0.0

正式发布

1. 优化扩展体积，移除/压缩资源
2. 修正 README 中的架构图
3. 将顶部菜单扩充到多图页类型

# 0.1.2

1. 修正 README 中的描述语法

# 0.1.1

1. 修正无法停止连接尝试的问题
2. 提供更为精确的使用教程

# 0.1.0

初始版本
