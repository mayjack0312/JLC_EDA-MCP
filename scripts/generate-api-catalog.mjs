import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const input = path.resolve("node_modules/@jlceda/pro-api-types/index.d.ts");
const outputDir = path.resolve("src/generated");
const output = path.join(outputDir, "api-catalog.json");
if (!fs.existsSync(input)) throw new Error(`Missing ${input}; run npm install first`);

const sourceText = fs.readFileSync(input, "utf8");
const source = ts.createSourceFile(input, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const classes = new Map();
let roots = [];

function docs(node) {
  const parts = [];
  for (const block of node.jsDoc || []) {
    if (typeof block.comment === "string") parts.push(block.comment);
    for (const tag of block.tags || []) {
      const comment = typeof tag.comment === "string" ? tag.comment : "";
      if (["remarks", "deprecated", "returns"].includes(tag.tagName.text) && comment) {
        parts.push(`${tag.tagName.text}: ${comment}`);
      }
    }
  }
  return parts.join("\n").trim();
}

function hasModifier(node, kind) {
  return Boolean(node.modifiers?.some((m) => m.kind === kind));
}

function visit(node) {
  if (ts.isClassDeclaration(node) && node.name) {
    const methods = [];
    for (const member of node.members) {
      if (!ts.isMethodDeclaration(member) || !member.name || hasModifier(member, ts.SyntaxKind.PrivateKeyword) || hasModifier(member, ts.SyntaxKind.ProtectedKeyword)) continue;
      const name = member.name.getText(source).replace(/^['"]|['"]$/g, "");
      methods.push({
        name,
        description: docs(member),
        deprecated: (member.jsDoc || []).some((d) => (d.tags || []).some((t) => t.tagName.text === "deprecated")),
        parameters: member.parameters.map((p) => ({
          name: p.name.getText(source),
          type: p.type?.getText(source) || "any",
          optional: Boolean(p.questionToken || p.initializer),
          rest: Boolean(p.dotDotDotToken),
        })),
        returns: member.type?.getText(source) || "any",
      });
    }
    if (methods.length) classes.set(node.name.text, methods);
  }
  if (ts.isClassDeclaration(node) && node.name?.text === "EDA") {
    roots = node.members
      .filter((m) => ts.isPropertyDeclaration(m) && m.name && m.type && !hasModifier(m, ts.SyntaxKind.PrivateKeyword))
      .map((m) => ({ property: m.name.getText(source), className: m.type.getText(source) }));
  }
  ts.forEachChild(node, visit);
}
visit(source);

const seen = new Map();
for (const root of roots) {
  for (const method of classes.get(root.className) || []) {
    const id = `${root.property}.${method.name}`;
    const existing = seen.get(id);
    if (existing) {
      existing.overloads.push({ parameters: method.parameters, returns: method.returns });
    } else {
      seen.set(id, { id, namespace: root.property, className: root.className, ...method, overloads: [] });
    }
  }
}

const pkg = JSON.parse(fs.readFileSync(path.resolve("node_modules/@jlceda/pro-api-types/package.json"), "utf8"));
const catalog = {
  generatedAt: new Date().toISOString(),
  apiTypesVersion: pkg.version,
  source: "@jlceda/pro-api-types/index.d.ts",
  namespaceCount: roots.length,
  methodCount: seen.size,
  methods: [...seen.values()].sort((a, b) => a.id.localeCompare(b.id)),
};
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Generated ${catalog.methodCount} API methods across ${catalog.namespaceCount} namespaces -> ${output}`);
