#!/usr/bin/env node
/** Serve one verified, immutable production generation. */

import { execFileSync, spawn } from "node:child_process";
import { cp, mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const buildDirectory = path.join(projectRoot, "dist");
const previewRoot = path.join(projectRoot, ".preview");
const verifier = path.join(projectRoot, "scripts/verify-offline-build.mjs");

function verify(directory) {
  execFileSync(process.execPath, [verifier, directory], {
    cwd: projectRoot,
    stdio: "inherit",
  });
}

async function isVerified(directory) {
  try {
    if (!(await stat(directory)).isDirectory()) return false;
    execFileSync(process.execPath, [verifier, directory], {
      cwd: projectRoot,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

async function directoryExists(directory) {
  try {
    return (await stat(directory)).isDirectory();
  } catch {
    return false;
  }
}

verify(buildDirectory);
const manifest = JSON.parse(
  await readFile(path.join(buildDirectory, "offline-manifest.json"), "utf8"),
);
if (!/^[a-f0-9]{20}$/.test(manifest.version ?? "")) {
  throw new Error("The verified build has an invalid offline version");
}

await mkdir(previewRoot, { recursive: true });
const stableSnapshot = path.join(previewRoot, manifest.version);
let snapshot = stableSnapshot;
if (!(await directoryExists(stableSnapshot))) {
  await cp(buildDirectory, stableSnapshot, { recursive: true });
  verify(stableSnapshot);
} else if (!(await isVerified(stableSnapshot))) {
  snapshot = `${stableSnapshot}-${Date.now()}`;
  await cp(buildDirectory, snapshot, { recursive: true });
  verify(snapshot);
}

const viteCli = path.join(projectRoot, "node_modules/vite/bin/vite.js");
const child = spawn(
  process.execPath,
  [
    viteCli,
    "preview",
    "--host",
    "127.0.0.1",
    "--outDir",
    snapshot,
    ...process.argv.slice(2),
  ],
  { cwd: projectRoot, stdio: "inherit" },
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.once("error", (error) => {
  throw error;
});
child.once("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exitCode = code ?? 1;
});
