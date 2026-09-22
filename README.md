[English](./README.en.md) | 中文

# extension-dev-mcp-tools — Complete EasyEDA Pro MCP

本版本在官方扩展开发调试 MCP 基础上，对接当前 `@jlceda/pro-api-types` 中 `EDA` 根对象开放的全部 API。

## 当前覆盖

- 98 个官方 API 命名空间
- 760 个公开 API 方法，全部生成直接 MCP 工具
- 6 个连接、目录、搜索、描述及统一调用工具
- 保留 `import_plugin`、`dev_plugin`、`get_console_logs`
- 内置本机 WebSocket Bridge，无需另启 Bridge 进程
- 附带官方 `run-api-gateway_v1.0.6.eext`

完整统计见 [`docs/COVERAGE_REPORT.md`](docs/COVERAGE_REPORT.md)。

## 使用

1. 安装 Node.js 20.17 或更高版本。
2. 在嘉立创EDA专业版导入 `bundled-gateway/run-api-gateway_v1.0.6.eext`，并启用扩展的 WebSocket/外部交互权限。
3. 执行：

   ```shell
   npm install
   npm run build
   npm start
   ```

4. 在 MCP 客户端中使用 `easyeda_bridge_status` 确认 EDA 窗口已连接。

默认注册全部760个直接 API 工具。若客户端无法承载较大的 `tools/list`，设置环境变量 `EASYEDA_TOOL_PROFILE=compact`；此时仍可通过 `easyeda_api_search`、`easyeda_api_describe`、`easyeda_api_call` 访问全部760个官方方法。

直接调用工具统一接收：

- `args`: 按官方签名顺序排列的 JSON 参数数组；
- `windowId`: 可选，多窗口时指定目标窗口。

## 更新官方 SDK

修改 `package.json` 中 `@jlceda/pro-api-types` 版本后执行：

```shell
npm install
npm run build
npm test
```

构建脚本会重新扫描官方类型定义并生成完整目录，不依赖手工维护工具清单。

---

用于 [嘉立创EDA & EasyEDA 专业版](https://lceda.cn/) 扩展调试的 MCP 服务。使用此MCP可以实现通过 AI Agent 自动完成插件导入、浏览器控制台日志采集等操作，由AI自动导入、调试插件。

## 功能

| 工具 | 说明 |
|------|------|
| `import_plugin` | 自动将eext导入到嘉立创EDA专业版 |
| `dev_plugin` | 导入插件并开启控制台错误日志持续监听 |
| `get_console_logs` | 获取浏览器控制台输出（支持过滤、分页、清空） |


## 安装说明
### 1.构建MCP
任意找一个用于存放MCP的位置，然后在终端执行以下命令
```bash
git clone https://github.com/easyeda/extension-dev-mcp-tools
cd ./extension-dev-mcp-tools
npm install
npm run build
```
构建后产物位于`dist`文件夹下

### 2.配置 MCP

执行以下命令生成MCP配置文件

```bash
npm run mcp-config
```
此时会生成mcp-config.json和opencode.json  
将生成的MCP配置文件按照你所使用的AI Agent提供的文档导入  

例如：  

> **QwenCode**  
> **项目作用域**：位于项目根目录下的 .qwen/settings.json  
> **用户作用域**：位于 ~/.qwen/settings.json，对本机所有项目生效  
> 只需将生成的mcp-config.json重命名为settings.json存放到对应路径即可

> **OpenCode**  
> **项目作用域**：位于项目根目录下的 opencode.json  
> **用户作用域**：位于 ~/.config/opencode/opencode.json，对本机所有项目生效  
> 只需将生成的opencode.json存放到对应路径即可

> **Kiro/Trae**  
> 将生成的mcp-config.json内容复制到对应编辑器的MCP配置页即可

完成后重启你所使用的AI Agent
### 3.使用 MCP
打开你的插件源码文件夹  
向AI提出：  
`帮我导入这个插件`、`帮我调试这个插件`、`获取浏览器日志`    
此时会自动调用对应的工具：    
`import_plugin`、`dev_plugin`、`get_console_logs`  
如果想指定浏览器，可以向AI提出：  
`帮我导入这个插件，使用Edge浏览器`、`帮我调试这个插件，使用Chrome浏览器`  
`获取Edge浏览器日志`、`获取Chrome浏览器的错误日志`    

## 工作原理

1. 未指定浏览器下默认启动 Chrome（开启远程调试端口 9222-9231），或连接已运行的实例
2. 自动在浏览器中打开嘉立创EDA专业版调试模式，未登录时自动弹出扫码登录页面
3. 登录状态缓存在 `.browser-data/` 目录，后续无需重复登录
4. 通过 Playwright 操作浏览器完成插件上传流程
5. `import_plugin` 导入后自动注册页面 `console` 和 `pageerror` 事件监听，捕获所有 log / warn / error / info 输出，最多缓存 500 条
6. 通过 `get_console_logs` 随时拉取缓存日志，支持按类型或关键词过滤、限制返回条数、获取后清空缓存
7. AI Agent可按获取到的日志情况分析插件运行状态，以便对插件源码调整

## 环境要求

- Node.js 20.17.0+
- Google Chrome / Microsoft Edge

## 调试用浏览器路径配置（可选）

工具会自动查找 Chrome 安装路径：
- Windows：查注册表 `App Paths` 或常见安装位置
- macOS：`/Applications/Google Chrome.app/...`
- Linux：通过 `which` 查找 `google-chrome` / `chromium` 

如果自动检测失败，或需要使用特定浏览器，可直接对AI说：  
`帮我导入这个插件，使用edge浏览器`  
由AI自行查找浏览器路径并导入

## 已测试的平台
  
✅OpenClaw  
✅OpenCode  
✅QwenCode  
✅Kiro  
✅Trae  


## 演示视频

基于opencode:  

https://github.com/user-attachments/assets/45a66a9c-96e5-43a4-a9af-c94d2007f1a3




