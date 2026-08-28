import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(root, "course_content", "api-reference.json");
const markdownPath = path.join(root, "USER_REFERENCE.md");
const textPath = path.join(root, "v2_03_ucsb_xrp_api_reference.txt");
const check = process.argv.includes("--check");

const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const markdown = renderMarkdown(catalog);
const plainText = renderPlainText(catalog);

if (check) {
  const mismatches = [];
  if ((await readFile(markdownPath, "utf8")) !== markdown) {
    mismatches.push(path.relative(root, markdownPath));
  }
  if ((await readFile(textPath, "utf8")) !== plainText) {
    mismatches.push(path.relative(root, textPath));
  }
  if (mismatches.length > 0) {
    throw new Error(
      `Generated API documents are stale: ${mismatches.join(", ")}. Run node scripts/render-api-reference.mjs.`,
    );
  }
} else {
  await writeFile(markdownPath, markdown);
  await writeFile(textPath, plainText);
}

function renderMarkdown(source) {
  const lines = [
    `# ${source.title}`,
    "",
    `API version: \`${source.apiVersion}\`.`,
    "",
    source.introduction,
    "",
    "## Units and coordinate conventions",
    "",
    ...source.conventions.map((item) => `- ${item}`),
    "",
  ];

  for (const section of source.sections) {
    lines.push(`## ${section.title}`, "");
    if (section.introduction) lines.push(section.introduction, "");
    for (const entry of section.entries) renderMarkdownEntry(lines, entry);
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function renderMarkdownEntry(lines, entry) {
  lines.push(`### \`${entry.name}\``, "", entry.purpose, "");
  const facts = [];
  if (entry.kind) facts.push(`**Kind:** ${entry.kind}`);
  if (entry.projectFile)
    facts.push(`**Project file:** \`${entry.projectFile}\``);
  if (entry.baseClass) facts.push(`**Base class:** \`${entry.baseClass}\``);
  const importStatement = entryImport(entry);
  if (importStatement) facts.push(`**Import:** \`${importStatement}\``);
  if (facts.length > 0) lines.push(...facts.map((fact) => `- ${fact}`), "");
  if (entry.signature) {
    lines.push(
      `**${signatureTitle(entry)}**`,
      "",
      "```python",
      entry.signature,
      "```",
      "",
    );
  }
  if (entry.state) {
    lines.push("**State between calls:**", "", entry.state, "");
  }
  if (entry.relevantConfigFields) {
    lines.push(
      `**Configuration used:** ${entry.relevantConfigFields.map((name) => `\`${name}\``).join(", ")}.`,
      "",
    );
  }
  if (entry.parameters?.length) {
    lines.push(`**${entryParameterTitle(entry)}**`, "");
    renderMarkdownTable(lines, entry.parameters);
  }
  if (entry.properties?.length) {
    lines.push(`**${propertyTitle(entry)}**`, "");
    renderMarkdownTable(lines, entry.properties);
  }
  for (const method of entry.methods ?? []) renderMarkdownMethod(lines, method);
  if (entry.returns) {
    lines.push(
      `**Returns:** \`${entry.returns.type}\` — ${entry.returns.description}`,
      "",
    );
  }
  renderList(lines, "Required behavior", entry.requiredBehavior);
  renderList(lines, "Exceptions", entry.exceptions);
  renderList(lines, "Notes", entry.notes);
  if (entry.example) {
    lines.push(
      `**${entry.example.title}**`,
      "",
      "```python",
      entry.example.code,
      "```",
      "",
    );
  }
}

function renderMarkdownMethod(lines, method) {
  lines.push(
    `#### \`${method.name}()\``,
    "",
    method.summary,
    "",
    "```python",
    method.signature,
    "```",
    "",
  );
  if (method.parameters?.length) {
    lines.push("**Parameters**", "");
    renderMarkdownTable(lines, method.parameters);
  }
  if (method.returns) {
    lines.push(
      `**Returns:** \`${method.returns.type}\` — ${method.returns.description}`,
      "",
    );
  }
  renderList(lines, "Required behavior", method.requiredBehavior);
  renderList(lines, "Exceptions", method.exceptions);
}

function renderMarkdownTable(lines, rows) {
  lines.push(
    "| Name | Type | Default | Unit | Description |",
    "| --- | --- | --- | --- | --- |",
  );
  for (const row of rows) {
    lines.push(
      `| \`${row.name}\` | \`${row.type}\` | ${row.default ?? "—"} | ${row.units ?? "—"} | ${row.description} |`,
    );
  }
  lines.push("");
}

function renderList(lines, title, values) {
  if (!values?.length) return;
  lines.push(`**${title}**`, "", ...values.map((value) => `- ${value}`), "");
}

function renderPlainText(source) {
  const lines = [
    source.title.toUpperCase(),
    `API version: ${source.apiVersion}`,
    "",
    source.introduction,
    "",
    "UNITS AND COORDINATE CONVENTIONS",
    ...source.conventions.map((item) => `- ${item}`),
    "",
  ];
  for (const section of source.sections) {
    lines.push(section.title.toUpperCase(), "");
    if (section.introduction) lines.push(section.introduction, "");
    for (const entry of section.entries) renderPlainEntry(lines, entry);
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

function renderPlainEntry(lines, entry) {
  lines.push(entry.name, "-".repeat(entry.name.length), entry.purpose);
  if (entry.kind) lines.push(`Kind: ${entry.kind}`);
  if (entry.projectFile) lines.push(`Project file: ${entry.projectFile}`);
  if (entry.baseClass) lines.push(`Base class: ${entry.baseClass}`);
  const importStatement = entryImport(entry);
  if (importStatement) lines.push(`Import: ${importStatement}`);
  if (entry.signature) {
    lines.push(`${signatureTitle(entry)}: ${entry.signature}`);
  }
  if (entry.state) lines.push(`State between calls: ${entry.state}`);
  if (entry.relevantConfigFields) {
    lines.push(`Configuration used: ${entry.relevantConfigFields.join(", ")}`);
  }
  renderPlainValues(lines, entryParameterTitle(entry), entry.parameters);
  renderPlainValues(lines, propertyTitle(entry), entry.properties);
  for (const method of entry.methods ?? []) {
    lines.push(
      "",
      `${method.name}()`,
      method.summary,
      `Signature: ${method.signature}`,
    );
    renderPlainValues(lines, "Parameters", method.parameters);
    if (method.returns) {
      lines.push(
        `Returns: ${method.returns.type} - ${method.returns.description}`,
      );
    }
    renderPlainList(lines, "Required behavior", method.requiredBehavior);
    renderPlainList(lines, "Exceptions", method.exceptions);
  }
  if (entry.returns) {
    lines.push(`Returns: ${entry.returns.type} - ${entry.returns.description}`);
  }
  renderPlainList(lines, "Required behavior", entry.requiredBehavior);
  renderPlainList(lines, "Exceptions", entry.exceptions);
  renderPlainList(lines, "Notes", entry.notes);
  if (entry.example) {
    lines.push("", entry.example.title, entry.example.code);
  }
  lines.push("");
}

function renderPlainValues(lines, title, values) {
  if (!values?.length) return;
  lines.push(`${title}:`);
  for (const value of values) {
    const details = [
      value.type,
      value.default && `default ${value.default}`,
      value.units,
    ]
      .filter(Boolean)
      .join("; ");
    lines.push(`- ${value.name} (${details}): ${value.description}`);
  }
}

function renderPlainList(lines, title, values) {
  if (!values?.length) return;
  lines.push(`${title}:`, ...values.map((value) => `- ${value}`));
}

function entryImport(entry) {
  if (entry.import) return entry.import;
  if (entry.projectFile) {
    return `from ${entry.projectFile.replace(/\.py$/, "")} import ${entry.name}`;
  }
  if (entry.id === "module-live" || entry.name.startsWith("live.")) {
    return "from ucsb_xrp import live";
  }
  if (entry.kind === "value object") return null;
  return `from ucsb_xrp import ${entry.name}`;
}

function signatureTitle(entry) {
  if (entry.baseClass) return "Class declaration";
  if (entry.kind === "constant") return "Value";
  if (entry.signature?.includes(".from_arena(")) return "Factory function";
  if (
    entry.kind.includes("class") ||
    entry.kind.includes("record") ||
    entry.kind === "value object"
  ) {
    return "Constructor";
  }
  return "Signature";
}

function entryParameterTitle(entry) {
  if (entry.signature?.includes(".from_arena(")) return "Factory parameters";
  if (entry.baseClass || entry.kind.includes("class")) {
    return "Constructor parameters";
  }
  return "Parameters";
}

function propertyTitle(entry) {
  if (entry.kind === "configuration record") {
    return "Constructor parameters and readable fields";
  }
  return "Readable fields";
}
