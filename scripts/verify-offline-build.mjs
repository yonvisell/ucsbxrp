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
const outputDirectory = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(projectRoot, "dist");
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
assert.ok(
  serviceWorkerText.includes(
    'canonicalUrl.startsWith(SCOPE_PATH + "course/commissioning/")',
  ),
  "the first release-scoped worker must retain legacy commissioning files for already-open tabs",
);
const navigationHandlerStart = serviceWorkerText.indexOf(
  'if (request.mode === "navigate")',
);
const navigationHandlerEnd = serviceWorkerText.indexOf(
  "const canonicalUrl = url.pathname;",
  navigationHandlerStart,
);
const navigationHandler = serviceWorkerText.slice(
  navigationHandlerStart,
  navigationHandlerEnd,
);
assert.ok(
  navigationHandlerStart >= 0 && navigationHandlerEnd > navigationHandlerStart,
  "service worker must define the application navigation handler",
);
assert.ok(
  navigationHandler.indexOf("await cache.match(") >= 0 &&
    navigationHandler.indexOf("await cache.match(") <
      navigationHandler.indexOf("await fetch(request)"),
  "application navigation must use the installed shell before attempting the internet",
);

for (const requiredPath of [
  "index.html",
  "ide/index.html",
  "monitor/index.html",
  "dashboard/index.html",
  "guide/index.html",
  "reference/index.html",
  "commission/index.html",
  "favicon.svg",
  "manifest.webmanifest",
  "app-icon-192.png",
  "app-icon-512.png",
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

const webAppManifest = JSON.parse(
  await readFile(path.join(outputDirectory, "manifest.webmanifest"), "utf8"),
);
assert.equal(
  webAppManifest.id,
  "./",
  "installed app id must follow its base URL",
);
assert.equal(
  webAppManifest.start_url,
  "./workspace/?mode=ide",
  "installed app must open the single IDE and Monitor workspace",
);
assert.equal(
  webAppManifest.scope,
  "./",
  "installed app scope must follow its deployment base URL",
);
assert.equal(
  webAppManifest.display,
  "browser",
  "course pages must reopen in an ordinary browser tab",
);
assert.deepEqual(
  webAppManifest.icons?.map(({ sizes, src, type }) => ({ sizes, src, type })),
  [
    {
      sizes: "192x192",
      src: "./app-icon-192.png",
      type: "image/png",
    },
    {
      sizes: "512x512",
      src: "./app-icon-512.png",
      type: "image/png",
    },
  ],
  "installed app must declare both required PNG icons",
);
for (const entryPath of [
  "index.html",
  "ide/index.html",
  "monitor/index.html",
  "dashboard/index.html",
  "guide/index.html",
  "reference/index.html",
  "commission/index.html",
]) {
  const html = await readFile(path.join(outputDirectory, entryPath), "utf8");
  assert.ok(
    html.includes(`rel="manifest" href="${basePath}manifest.webmanifest"`),
    `${entryPath} must link the installed-app manifest`,
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
const physicalTargetWorker = assets.find(
  (asset) => asset.path === "assets/physical-target.shared-worker.js",
);
assert.ok(micropythonWorker, "offline shell is missing the MicroPython worker");
assert.ok(
  virtualTargetWorker,
  "offline shell is missing the virtual target worker",
);
assert.ok(
  physicalTargetWorker,
  "offline shell must give the physical target worker a stable URL so open app releases share one XRP connection",
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
const commissioningManifestPath = `course/commissioning/releases/${courseRelease.release_sequence}/manifest.json`;
assert.ok(
  assets.some((asset) => asset.path === commissioningManifestPath),
  `offline shell is missing ${commissioningManifestPath}`,
);
const commissioningManifest = JSON.parse(
  await readFile(path.join(outputDirectory, commissioningManifestPath), "utf8"),
);
const referenceArtifacts = courseRelease.ucsb_xrp?.reference_artifacts ?? [];
const firmwareAsset = courseRelease.micropython?.asset;
assert.equal(typeof firmwareAsset, "string", "course firmware name is missing");
const firmwareSha256 = courseRelease.micropython?.sha256;
assert.equal(
  typeof firmwareSha256,
  "string",
  "course firmware digest is missing",
);
const commissioningFirmware = commissioningManifest.micropython?.firmware;
assert.deepEqual(
  commissioningFirmware,
  {
    asset: firmwareAsset,
    url: `firmware/sha256/${firmwareSha256}/${firmwareAsset}`,
    bytes: courseRelease.micropython.byte_size,
    sha256: firmwareSha256,
  },
  "commissioning firmware must use its content-addressed release URL",
);
const commissioningFirmwarePath = path.posix.normalize(
  path.posix.join(
    path.posix.dirname(commissioningManifestPath),
    commissioningFirmware.url,
  ),
);
assert.ok(
  assets.some(
    (asset) =>
      asset.path === commissioningFirmwarePath &&
      asset.bytes === courseRelease.micropython.byte_size &&
      asset.sha256 === firmwareSha256,
  ),
  "offline commissioning firmware differs from release.json",
);
assert.ok(
  !assets.some((asset) =>
    asset.path.startsWith(`${COURSE_RELEASE_OUTPUT_PATH}/firmware/`),
  ),
  "offline shell must not duplicate firmware under course/current",
);
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
