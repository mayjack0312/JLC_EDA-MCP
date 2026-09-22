"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = require("zod");
const dev_plugin_js_1 = require("./tools/dev-plugin.js");
const easyeda_api_js_1 = require("./tools/easyeda-api.js");
const easyeda_bridge_js_1 = require("./easyeda-bridge.js");
const server = new mcp_js_1.McpServer({
    name: "extension-dev-mcp-tools",
    version: "2.0.0",
});
(0, easyeda_api_js_1.registerEasyEdaApiTools)(server);
server.tool("import_plugin", "导入插件到嘉立创EDA并开启浏览器控制台监听。插件文件通常位于项目的 build/dist 目录下，后缀为 .eext。调用前请先确认 pluginPath 指向该目录下的 .eext 文件。自动打开浏览器访问立创EDA，如果未登录会弹出扫码登录页面等待用户扫码，登录后自动执行：高级→扩展管理器→上传插件文件→导入。登录状态会缓存，下次无需重复登录。导入后可通过 get_console_logs 获取控制台输出。", {
    pluginPath: zod_1.z.string().describe("插件文件的绝对路径"),
    browserPath: zod_1.z.string().optional().describe("浏览器可执行文件的绝对路径（如 Edge、Chrome），不传则自动检测"),
}, async (args) => ({ content: [await (0, dev_plugin_js_1.importPlugin)(args)] }));
server.tool("dev_plugin", "调试插件到嘉立创EDA并持续监听控制台，直到出现 error 日志时返回错误内容。插件文件通常位于项目的 build/dist 目录下，后缀为 .eext。调用前请先确认 pluginPath 指向该目录下的 .eext 文件。适用于需要自动捕获插件运行错误的调试场景。超时未检测到错误则返回成功。", {
    pluginPath: zod_1.z.string().describe("插件文件的绝对路径"),
    timeout: zod_1.z.number().optional().describe("最大等待秒数，默认300秒（5分钟）"),
    browserPath: zod_1.z.string().optional().describe("浏览器可执行文件的绝对路径（如 Edge、Chrome），不传则自动检测"),
}, async (args) => ({ content: [await (0, dev_plugin_js_1.devPlugin)(args)] }));
server.tool("get_console_logs", "获取嘉立创EDA浏览器控制台日志。需先通过 import_plugin 或 dev_plugin 导入插件并开启监听。支持按类型/关键词过滤，可指定返回条数，可选择获取后清空。", {
    filter: zod_1.z.string().optional().describe("过滤关键词，匹配日志类型或内容（如 error、warn、某个函数名）"),
    count: zod_1.z.number().optional().describe("返回最近N条日志，默认50条"),
    clear: zod_1.z.boolean().optional().describe("获取后是否清空日志缓存，默认false"),
    browserPath: zod_1.z.string().optional().describe("浏览器可执行文件的绝对路径（如 Edge、Chrome），不传则自动检测"),
}, async (args) => ({ content: [await (0, dev_plugin_js_1.getConsoleLogs)(args)] }));
async function main() {
    await easyeda_bridge_js_1.easyEdaBridge.start();
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("extension-dev-mcp-tools MCP Server started");
}
main().catch((err) => {
    console.error("Failed to start:", err);
    process.exit(1);
});
