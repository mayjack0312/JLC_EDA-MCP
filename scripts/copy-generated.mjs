import fs from "node:fs";
fs.mkdirSync("dist/generated", { recursive: true });
fs.copyFileSync("src/generated/api-catalog.json", "dist/generated/api-catalog.json");
