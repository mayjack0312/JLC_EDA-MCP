const fs = require("node:fs");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");

(async () => {
  const catalog = JSON.parse(fs.readFileSync("src/generated/api-catalog.json", "utf8"));
  if (catalog.methodCount !== catalog.methods.length) throw new Error("Catalog method count mismatch");
  const transport = new StdioClientTransport({ command: process.execPath, args: ["dist/index.js"], stderr: "pipe" });
  const client = new Client({ name: "easyeda-mcp-smoke", version: "1.0.0" });
  await client.connect(transport);
  const response = await client.listTools();
  const expected = catalog.methodCount + 9; // 760 SDK + 6 management + 3 legacy development tools
  if (response.tools.length !== expected) throw new Error(`Expected ${expected} tools, got ${response.tools.length}`);
  const names = new Set(response.tools.map((tool) => tool.name));
  if (names.size !== response.tools.length) throw new Error("Duplicate MCP tool names detected");
  for (const name of ["easyeda_api_call", "easyeda_api_search", "import_plugin", "get_console_logs"]) {
    if (!names.has(name)) throw new Error(`Missing required tool: ${name}`);
  }
  await client.close();
  console.log(`PASS: ${response.tools.length} unique MCP tools; ${catalog.methodCount} official API methods.`);
})().catch((error) => { console.error(error); process.exit(1); });
