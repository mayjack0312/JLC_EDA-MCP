# EasyEDA Pro API 使用指南

本页说明 JLC_EDA-MCP v2.0 如何发现、描述和调用官方 EasyEDA Pro API。

## 1. 调用前检查

先确保：

1. MCP Server 已启动；
2. 已在嘉立创EDA专业版导入并启用 `bundled-gateway/run-api-gateway_v1.0.6.eext`；
3. Gateway 已获得所需 WebSocket / 外部交互权限；
4. 至少有一个 EasyEDA Pro 窗口连接到本机 Bridge。

调用：

`easyeda_bridge_status`

典型返回会包含：

~~~json
{
  "service": "easyeda-bridge",
  "port": 49620,
  "activeWindowId": "...",
  "count": 1,
  "windows": []
}
~~~

`count` 为 0 时不要继续调用业务 API，应先检查 Gateway 是否安装、启用以及是否成功连接。

## 2. 推荐的 Agent 调用流程

当 Agent 不确定具体 API 名称时，推荐：

~~~text
easyeda_bridge_status
        ↓
easyeda_api_search
        ↓
easyeda_api_describe
        ↓
easyeda_api_call
~~~

这套流程在 Full 和 Compact 模式下都可用。

## 3. 搜索 API

`easyeda_api_search` 参数：

| 参数 | 类型 | 说明 |
|---|---|---|
| `query` | string，可选 | 搜索方法 ID、说明、参数名或参数类型 |
| `namespace` | string，可选 | 精确限制命名空间，例如 `pcb_PrimitiveTrack` |
| `includeDeprecated` | boolean，可选 | 是否包含已弃用 API，默认 `false` |
| `limit` | number，可选 | 最大结果数，1-200，默认 50 |

例如搜索“当前工程信息”，Agent 可以用 project / current project 等关键词查找，再根据返回的 `id` 与 `signature` 选择方法。

## 4. 查看 API 完整签名

`easyeda_api_describe` 接受完整方法 ID：

~~~json
{
  "method": "dmt_Project.getCurrentProjectInfo"
}
~~~

返回内容包括：

- namespace
- className
- method name
- description
- deprecated
- parameters
- returns
- overloads
- 对应直接 MCP Tool 名称
- 格式化 signature

在传参前建议先 describe，特别是存在重载、可选参数或复杂对象参数时。

## 5. 统一调用 easyeda_api_call

`easyeda_api_call` 参数：

| 参数 | 类型 | 说明 |
|---|---|---|
| `method` | string | 完整方法 ID，例如 `dmt_Project.getCurrentProjectInfo` |
| `args` | array，可选 | 按官方签名顺序传入的 JSON 参数数组，默认 `[]` |
| `windowId` | string，可选 | 指定目标 EasyEDA 窗口 |

无参数方法示例：

~~~json
{
  "method": "dmt_Project.getCurrentProjectInfo",
  "args": []
}
~~~

统一调用只允许 API Catalog 中存在的方法，不接受任意 JavaScript。

## 6. Full 模式直接调用

默认情况下：

~~~text
EASYEDA_TOOL_PROFILE=all
~~~

760 个方法全部注册为独立 Tool，命名规则：

`eda_<namespace>_<method>`

CamelCase 和命名空间中的非字母数字字符会被转换为 snake_case。

例如 `dmt_Project.getCurrentProjectInfo` 会生成对应的 `eda_...` 直接工具。Agent 已经知道正确工具时，可直接调用，无需经过 `easyeda_api_call`。

所有直接工具统一接受：

~~~json
{
  "args": [],
  "windowId": "optional-window-id"
}
~~~

## 7. Compact 模式

部分 MCP Client 对超大的 `tools/list` 支持不好。可在启动 MCP 时设置：

### Windows CMD

~~~bat
set EASYEDA_TOOL_PROFILE=compact
node dist\index.js
~~~

### PowerShell

~~~powershell
$env:EASYEDA_TOOL_PROFILE='compact'
node dist/index.js
~~~

### macOS / Linux

~~~bash
EASYEDA_TOOL_PROFILE=compact node dist/index.js
~~~

Compact 模式不注册 760 个独立工具，但 API Catalog 和统一调用仍覆盖全部 760 个方法。

## 8. 多窗口调用

`easyeda_bridge_status` 会返回当前连接的窗口列表以及 `activeWindowId`。

有两种方式指定目标：

1. 调用 `easyeda_select_window` 修改后续默认窗口；
2. 在 `easyeda_api_call` 或直接 API Tool 中传 `windowId`。

显式传入的 `windowId` 优先于当前活动窗口。

## 9. 参数限制

MCP 统一调用层要求参数可 JSON 序列化，允许：

- null
- string
- number
- boolean
- array
- plain JSON object

不适合直接远程传入的典型类型包括：

- JavaScript function / callback
- DOM / browser native object
- `File` / `Blob`
- 依赖页面上下文创建的特殊实例

因此“760 / 760 已对接”代表目录和调用入口覆盖，不代表每个 API 都能用纯 JSON 参数完成所有调用场景。

## 10. 参数数量校验

调用前会根据生成目录检查：

- 必填参数数量是否满足；
- 无 rest 且无重载时，参数是否超过最大数量；
- 参数是否可 JSON 序列化。

参数类型的最终有效性仍由 EasyEDA Pro 官方运行时判定。

## 11. 超时

默认单次调用超时 30000 ms。可使用：

~~~text
EASYEDA_API_TIMEOUT_MS=60000
~~~

增加超时时间。若大量普通 API 都超时，应优先检查 Gateway / EDA 窗口连接，而不是单纯增加超时。

## 12. API Catalog 与版本

`easyeda_api_catalog` 会返回：

- `apiTypesVersion`
- `generatedAt`
- `namespaceCount`
- `methodCount`
- `namespaces`

当前仓库基线为：

- `@jlceda/pro-api-types`: 0.4.23
- `pro-api-sdk`: 1.6.27（覆盖报告记录）
- namespace: 98
- public methods: 760

SDK 升级后应运行 `npm install && npm run build && npm test` 重新生成并验证目录。

## 13. 错误处理原则

MCP 不伪造 API 成功。以下问题会返回真实错误：

- Gateway 未连接
- windowId 无效或窗口已断开
- 方法 ID 不存在 / 未开放
- 参数数量错误
- 参数不可 JSON 序列化
- EasyEDA Pro 运行时权限 / 状态 / 版本限制
- 调用超时

排查步骤见 [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md)。
