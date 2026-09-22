/** import_plugin：导入插件并开启控制台监听，立即返回 */
export declare function importPlugin(args: {
    pluginPath: string;
    browserPath?: string;
}): Promise<{
    type: "text";
    text: any;
}>;
/** dev_plugin：导入插件后持续监听，等到出现 error 日志才返回 */
export declare function devPlugin(args: {
    pluginPath: string;
    timeout?: number;
    browserPath?: string;
}): Promise<{
    type: "text";
    text: any;
}>;
/** 获取控制台日志 */
export declare function getConsoleLogs(args: {
    clear?: boolean;
    filter?: string;
    count?: number;
    browserPath?: string;
}): Promise<{
    type: "text";
    text: string;
}>;
