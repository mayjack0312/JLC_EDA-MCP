"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.catalog = void 0;
exports.registerEasyEdaApiTools = registerEasyEdaApiTools;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const zod_1 = require("zod");
const easyeda_bridge_js_1 = require("../easyeda-bridge.js");
const catalog = JSON.parse(node_fs_1.default.readFileSync(node_path_1.default.join(__dirname, "../generated/api-catalog.json"), "utf8"));
exports.catalog = catalog;
const methodMap = new Map(catalog.methods.map((method) => [method.id, method]));
function result(value, isError = false) {
    return {
        content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }],
        isError,
    };
}
function assertJsonSafe(value, path = "args") {
    if (value === null || ["string", "number", "boolean"].includes(typeof value))
        return;
    if (Array.isArray(value)) {
        value.forEach((item, index) => assertJsonSafe(item, `${path}[${index}]`));
        return;
    }
    if (typeof value === "object") {
        for (const [key, item] of Object.entries(value))
            assertJsonSafe(item, `${path}.${key}`);
        return;
    }
    throw new Error(`${path} 包含不可序列化值`);
}
async function executeMethod(method, args, windowId) {
    assertJsonSafe(args);
    const required = method.parameters.filter((p) => !p.optional && !p.rest).length;
    const hasRest = method.parameters.some((p) => p.rest);
    if (args.length < required)
        throw new Error(`${method.id} 至少需要 ${required} 个参数，当前为 ${args.length}`);
    if (!hasRest && args.length > method.parameters.length && method.overloads.length === 0) {
        throw new Error(`${method.id} 最多接受 ${method.parameters.length} 个参数，当前为 ${args.length}`);
    }
    const code = `const a=${JSON.stringify(args)};return await eda[${JSON.stringify(method.namespace)}][${JSON.stringify(method.name)}](...a);`;
    return easyeda_bridge_js_1.easyEdaBridge.execute(code, windowId);
}
function snake(value) {
    return value.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[^a-zA-Z0-9]+/g, "_").toLowerCase();
}
function toolName(method) {
    return `eda_${snake(method.namespace)}_${snake(method.name)}`;
}
function signature(method) {
    const params = method.parameters.map((p) => `${p.rest ? "..." : ""}${p.name}${p.optional ? "?" : ""}: ${p.type}`).join(", ");
    return `${method.id}(${params}) -> ${method.returns}`;
}
function registerEasyEdaApiTools(server) {
    server.tool("easyeda_bridge_status", "检查 EasyEDA API Bridge 和当前连接的嘉立创EDA窗口。", {}, async () => {
        try {
            await easyeda_bridge_js_1.easyEdaBridge.start();
            return result(easyeda_bridge_js_1.easyEdaBridge.status());
        }
        catch (error) {
            return result({ error: error.message }, true);
        }
    });
    server.tool("easyeda_select_window", "当连接了多个嘉立创EDA窗口时，选择后续API调用使用的窗口。", {
        windowId: zod_1.z.string().describe("easyeda_bridge_status 返回的窗口ID"),
    }, async ({ windowId }) => {
        try {
            easyeda_bridge_js_1.easyEdaBridge.selectWindow(windowId);
            return result({ success: true, activeWindowId: windowId });
        }
        catch (error) {
            return result({ error: error.message }, true);
        }
    });
    server.tool("easyeda_api_catalog", "列出当前包对接的官方EasyEDA Pro API版本、命名空间和方法数量。", {}, async () => result({
        apiTypesVersion: catalog.apiTypesVersion,
        generatedAt: catalog.generatedAt,
        namespaceCount: catalog.namespaceCount,
        methodCount: catalog.methodCount,
        namespaces: [...new Set(catalog.methods.map((m) => m.namespace))],
    }));
    server.tool("easyeda_api_search", "按方法名、命名空间、说明或参数类型搜索全部官方EasyEDA Pro API。", {
        query: zod_1.z.string().optional().describe("搜索词；省略时列出指定命名空间的方法"),
        namespace: zod_1.z.string().optional().describe("精确命名空间，如 pcb_PrimitiveTrack"),
        includeDeprecated: zod_1.z.boolean().optional().describe("是否包含已弃用API，默认false"),
        limit: zod_1.z.number().int().min(1).max(200).optional().describe("最大结果数，默认50"),
    }, async ({ query = "", namespace, includeDeprecated = false, limit = 50 }) => {
        const needle = query.toLowerCase();
        const matches = catalog.methods.filter((m) => (!namespace || m.namespace === namespace) &&
            (includeDeprecated || !m.deprecated) &&
            (!needle || `${m.id} ${m.description} ${m.parameters.map((p) => `${p.name} ${p.type}`).join(" ")}`.toLowerCase().includes(needle)));
        return result({ total: matches.length, returned: Math.min(matches.length, limit), methods: matches.slice(0, limit).map((m) => ({ id: m.id, tool: toolName(m), signature: signature(m), description: m.description, deprecated: m.deprecated })) });
    });
    server.tool("easyeda_api_describe", "获取一个官方EasyEDA Pro API方法的完整签名、重载和说明。", {
        method: zod_1.z.string().describe("完整方法ID，如 dmt_Project.getCurrentProjectInfo"),
    }, async ({ method }) => {
        const found = methodMap.get(method);
        return found ? result({ ...found, tool: toolName(found), signature: signature(found) }) : result({ error: `未知官方API: ${method}` }, true);
    });
    server.tool("easyeda_api_call", "调用目录内任一官方EasyEDA Pro API。仅允许自动生成白名单中的方法，不接受任意代码。", {
        method: zod_1.z.string().describe("完整方法ID，如 dmt_Project.getCurrentProjectInfo"),
        args: zod_1.z.array(zod_1.z.unknown()).optional().describe("按官方签名顺序排列的JSON参数数组"),
        windowId: zod_1.z.string().optional().describe("目标EDA窗口ID；省略时使用当前活动窗口"),
    }, async ({ method, args = [], windowId }) => {
        const found = methodMap.get(method);
        if (!found)
            return result({ error: `未知或未开放的API: ${method}` }, true);
        try {
            return result(await executeMethod(found, args, windowId));
        }
        catch (error) {
            return result({ method, error: error.message }, true);
        }
    });
    // Full mode is the default requested distribution: every public SDK method is
    // registered as a directly callable MCP tool. Set EASYEDA_TOOL_PROFILE=compact
    // for clients that cannot handle a large tools/list response; the complete
    // catalog remains callable through easyeda_api_call in compact mode.
    if ((process.env.EASYEDA_TOOL_PROFILE || "all").toLowerCase() !== "compact") {
        for (const method of catalog.methods) {
            server.tool(toolName(method), `${signature(method)}\n${method.description || "官方 EasyEDA Pro API。"}${method.deprecated ? "\n[已弃用]" : ""}`, {
                args: zod_1.z.array(zod_1.z.unknown()).optional().describe("按官方签名顺序排列的JSON参数数组"),
                windowId: zod_1.z.string().optional().describe("目标EDA窗口ID；省略时使用当前活动窗口"),
            }, async ({ args = [], windowId }) => {
                try {
                    return result(await executeMethod(method, args, windowId));
                }
                catch (error) {
                    return result({ method: method.id, error: error.message }, true);
                }
            });
        }
    }
}
