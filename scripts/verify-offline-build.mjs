import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  collectBuildAssets,
  COURSE_RELEASE_OUTPUT_PATH,
  createOfflineManifest,
  MANIFEST_FILENAME,
  normalizeBasePath,
  renderServiceWorker,
  SERVICE_WORKER_FILENAME,
} from "./offline-build.mjs";

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outputDirectory = path.join(projectRoot, "dist");
const basePath = normalizeBasePath(process.env.COURSE_BASE_PATH ?? "/");

const manifestText = await readFile(
  path.join(outputDirectory, MANIFEST_FILENAME),
  "utf8",
);
const serviceWorkerText = await readFile(
  path.join(outputDirectory, SERVICE_WORKER_FILENAME),
  "utf8",
);
const actualManifest = JSON.parse(manifestText);

const assets = await collectBuildAssets(outputDirectory, basePath);
const expectedManifest = createOfflineManifest(assets, basePath);
assert.deepEqual(
  actualManifest,
  expectedManifest,
  "offline-manifest.json must describe every built payload byte",
);
assert.equal(
  serviceWorkerText,
  renderServiceWorker(expectedManifest),
  "service-worker.js must be the deterministic worker for this manifest",
);

for (const requiredPath of [
  "index.html",
  "ide/index.html",
  "dashboard/index.html",
  "guide/index.html",
  "favicon.svg",
  "third-party-licenses/README.txt",
  "third-party-licenses/echarts/LICENSE",
  "third-party-licenses/echarts/NOTICE",
  "third-party-licenses/echarts/licenses/LICENSE-d3",
  "third-party-licenses/micropython--micropython-webassembly-pyscript/LICENSE",
  `${COURSE_RELEASE_OUTPUT_PATH}/release.json`,
  `${COURSE_RELEASE_OUTPUT_PATH}/ucsb_xrp/__init__.py`,
]) {
  assert.ok(
    assets.some((asset) => asset.path === requiredPath),
    `offline shell is missing ${requiredPath}`,
  );
}

const micropythonWorker = assets.find(
  (asset) =>
    asset.path.startsWith("assets/micropython.worker-") &&
    asset.path.endsWith(".js"),
);
const virtualTargetWorker = assets.find(
  (asset) =>
    asset.path.startsWith("assets/virtual-target.shared-worker-") &&
    asset.path.endsWith(".js"),
);
assert.ok(micropythonWorker, "offline shell is missing the MicroPython worker");
assert.ok(
  virtualTargetWorker,
  "offline shell is missing the virtual target worker",
);
assert.ok(
  assets.some(
    (asset) =>
      asset.path.startsWith("assets/micropython-") &&
      asset.path.endsWith(".wasm"),
  ),
  "offline shell is missing the MicroPython WebAssembly runtime",
);

const micropythonWorkerText = await readFile(
  path.join(outputDirectory, micropythonWorker.path),
  "utf8",
);
assert.match(
  micropythonWorkerText,
  /vendor\/current\/ucsb_xrp/,
  "MicroPython worker must contain the canonical course package",
);
assert.match(
  micropythonWorkerText,
  /class DriveCommand/,
  "MicroPython worker must contain recognizable canonical package source",
);

const courseRelease = JSON.parse(
  await readFile(
    path.join(outputDirectory, COURSE_RELEASE_OUTPUT_PATH, "release.json"),
    "utf8",
  ),
);
const referenceArtifacts = courseRelease.ucsb_xrp?.reference_artifacts ?? [];
for (const artifact of referenceArtifacts) {
  const publishedPath = `${COURSE_RELEASE_OUTPUT_PATH}/${artifact.path}`;
  const publishedAsset = assets.find((asset) => asset.path === publishedPath);
  assert.ok(publishedAsset, `offline bundle is missing ${artifact.path}`);
  assert.equal(
    publishedAsset.bytes,
    artifact.byte_size,
    `offline artifact size differs for ${artifact.path}`,
  );
  assert.equal(
    publishedAsset.sha256,
    artifact.sha256,
    `offline artifact hash differs for ${artifact.path}`,
  );
  assert.ok(
    !assets.some(
      (asset) =>
        asset.path === `${COURSE_RELEASE_OUTPUT_PATH}/${artifact.source}`,
    ),
    `offline student bundle exposes private source ${artifact.source}`,
  );
}
assert.ok(
  assets.every((asset) => !asset.path.includes("/reference_source/")),
  "offline student bundle must not publish reference solution source",
);

process.stdout.write(
  `Verified offline shell ${actualManifest.version}: ${assets.length} payload files\n`,
);
