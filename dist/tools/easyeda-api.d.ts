import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export interface ApiParameter {
    name: string;
    type: string;
    optional: boolean;
    rest: boolean;
}
export interface ApiMethod {
    id: string;
    namespace: string;
    className: string;
    name: string;
    description: string;
    deprecated: boolean;
    parameters: ApiParameter[];
    returns: string;
    overloads: Array<{
        parameters: ApiParameter[];
        returns: string;
    }>;
}
interface ApiCatalog {
    generatedAt: string;
    apiTypesVersion: string;
    source: string;
    namespaceCount: number;
    methodCount: number;
    methods: ApiMethod[];
}
declare const catalog: ApiCatalog;
export declare function registerEasyEdaApiTools(server: McpServer): void;
export { catalog };
