"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.importPlugin = importPlugin;
exports.devPlugin = devPlugin;
exports.getConsoleLogs = getConsoleLogs;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const browser_js_1 = require("../browser.js");
const consoleLogs = [];
const MAX_LOGS = 500;
let listening = false;
function startConsoleListener(p) {
    if (listening)
        return;
    listening = true;
    p.on("console", (msg) => {
        consoleLogs.push({
            timestamp: new Date().toISOString(),
            type: msg.type(),
            text: msg.text(),
        });
        if (consoleLogs.length > MAX_LOGS) {
            consoleLogs.splice(0, consoleLogs.length - MAX_LOGS);
        }
    });
    p.on("pageerror", (err) => {
        consoleLogs.push({
            timestamp: new Date().toISOString(),
            type: "error",
            text: err.message,
        });
    });
}
/** 执行插件导入操作（共用逻辑） */
async function doImport(p, pluginPath) {
    await (0, browser_js_1.navigateToEditor)(p);
    if (!(await (0, browser_js_1.ensureLoggedIn)(p))) {
        throw new Error("嘉立创EDA未登录，请先在浏览器中完成登录后再继续操作。");
    }
    // 窗口小时"高级"菜单可能藏在"更多"按钮里，需要先展开
    const moreButton = p.locator('.tool-bottom-menu-more_SoDfO');
    const moreContainer = p.locator('.tool-bottom-menu-more-container_NmJv7');
    const advancedMenu = p.locator('span[data-test="Advanced"]');
    const advancedInMore = moreContainer.locator('span[data-test="Advanced"]');
    // 尝试直接点击高级菜单
    try {
        await advancedMenu.click({ timeout: 2000 });
    }
    catch {
        // 如果失败，说明高级菜单藏在"更多"里
        const containerVisible = await moreContainer.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.visibility === 'visible';
        }).catch(() => false);
        if (!containerVisible) {
            await moreButton.click();
            await moreContainer.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { });
        }
        // 使用 JS 点击高级菜单
        await advancedInMore.evaluate((el) => el.click());
    }
    await p.waitForTimeout(300); // 等待高级菜单展开
    await p.getByText("扩展管理器", { exact: false }).click({ timeout: 10000 });
    const modal = p.locator("[class*='lc_modal_dialog']").first();
    await modal.waitFor({ state: "visible", timeout: 10000 });
    const [fileChooser] = await Promise.all([
        p.waitForEvent("filechooser", { timeout: 10000 }),
        modal.locator("button", { hasText: "导入" }).click(),
    ]);
    await fileChooser.setFiles(pluginPath);
    await p.waitForTimeout(2000);
    const closeBtn = modal.locator("[class*='close']").first();
    if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
    }
    else {
        await p.keyboard.press("Escape");
    }
    await p.waitForTimeout(300);
    return path.basename(pluginPath);
}
/** import_plugin：导入插件并开启控制台监听，立即返回 */
async function importPlugin(args) {
    if (!fs.existsSync(args.pluginPath)) {
        return { type: "text", text: `文件不存在: ${args.pluginPath}` };
    }
    const switched = await (0, browser_js_1.setBrowserPath)(args.browserPath);
    if (switched)
        listening = false;
    const p = await (0, browser_js_1.getPage)();
    try {
        consoleLogs.length = 0;
        startConsoleListener(p);
        const name = await doImport(p, args.pluginPath);
        return {
            type: "text",
            text: `插件导入成功: ${name}。已开启控制台监听，可通过 get_console_logs 获取调试日志。`,
        };
    }
    catch (error) {
        return { type: "text", text: error.message.includes("未登录") ? error.message : `导入失败: ${error.message}` };
    }
}
/** dev_plugin：导入插件后持续监听，等到出现 error 日志才返回 */
async function devPlugin(args) {
    if (!fs.existsSync(args.pluginPath)) {
        return { type: "text", text: `文件不存在: ${args.pluginPath}` };
    }
    const switched = await (0, browser_js_1.setBrowserPath)(args.browserPath);
    if (switched)
        listening = false;
    const p = await (0, browser_js_1.getPage)();
    try {
        consoleLogs.length = 0;
        startConsoleListener(p);
        const name = await doImport(p, args.pluginPath);
        // 等待 error 日志出现，超时则返回无错误
        // 导入后 5 秒内的错误忽略（可能是其他扩展的残留错误）
        const maxWait = (args.timeout || 300) * 1000;
        const startTime = Date.now();
        const graceEnd = startTime + 5000;
        const errorLogs = await new Promise((resolve) => {
            let collectDeadline = null;
            const interval = setInterval(() => {
                const errors = consoleLogs.filter((l) => l.type === "error" && new Date(l.timestamp).getTime() >= graceEnd);
                if (errors.length > 0 && collectDeadline === null) {
                    // 收到第一条 error，再等 5 秒收集更多
                    collectDeadline = Date.now() + 5000;
                }
                if (collectDeadline !== null && Date.now() >= collectDeadline) {
                    // 5 秒收集窗口结束，返回所有 error
                    clearInterval(interval);
                    const allErrors = consoleLogs.filter((l) => l.type === "error" && new Date(l.timestamp).getTime() >= graceEnd);
                    resolve(allErrors);
                }
                else if (Date.now() - startTime > maxWait) {
                    clearInterval(interval);
                    resolve([]);
                }
            }, 500);
        });
        if (errorLogs.length > 0) {
            return {
                type: "text",
                text: `插件 ${name} 导入后检测到 ${errorLogs.length} 条错误:\n${formatLogs(errorLogs)}`,
            };
        }
        return {
            type: "text",
            text: `插件 ${name} 导入成功，监听 ${args.timeout || 300} 秒内未检测到错误。`,
        };
    }
    catch (error) {
        return { type: "text", text: error.message.includes("未登录") ? error.message : `导入失败: ${error.message}` };
    }
}
/** 获取控制台日志 */
async function getConsoleLogs(args) {
    // 即使未调用 import_plugin / dev_plugin，也自动启动监听
    if (!listening) {
        await (0, browser_js_1.setBrowserPath)(args.browserPath);
        const p = await (0, browser_js_1.getPage)();
        startConsoleListener(p);
    }
    const count = args.count || 50;
    let logs = consoleLogs.slice(-count);
    if (args.filter) {
        const f = args.filter.toLowerCase();
        logs = logs.filter((l) => l.type.includes(f) || l.text.toLowerCase().includes(f));
    }
    const result = formatLogs(logs);
    if (args.clear) {
        consoleLogs.length = 0;
    }
    return {
        type: "text",
        text: logs.length === 0
            ? "暂无控制台日志。确保已通过 dev_plugin 导入插件并开启监听。"
            : `控制台日志(${logs.length}条):\n${result}`,
    };
}
function formatLogs(logs) {
    if (logs.length === 0)
        return "(空)";
    return logs
        .map((l) => `[${l.timestamp}] [${l.type}] ${l.text}`)
        .join("\n");
}
