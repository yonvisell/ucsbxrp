import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { instance } from "@viz-js/viz";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const diagrams = ["control-cycle", "project-structure", "system-boundary"];
const outputDirectory = resolve(repositoryRoot, "public/diagrams");
const viz = await instance();

await mkdir(outputDirectory, { recursive: true });

for (const name of diagrams) {
  const source = await readFile(
    resolve(repositoryRoot, `docs/diagrams/${name}.dot`),
    "utf8",
  );
  const svg = viz.renderString(source, { engine: "dot", format: "svg" });
  await writeFile(resolve(outputDirectory, `${name}.svg`), svg, "utf8");
}
