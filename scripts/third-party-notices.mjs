import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const LEGAL_FILENAME = /^(license|licence|notice|copying)(\.|$)/i;
const MICROPYTHON_PACKAGE =
  "node_modules/@micropython/micropython-webassembly-pyscript";

function packageDirectoryName(packagePath) {
  return packagePath
    .replaceAll("node_modules/", "")
    .replace(/^@/, "")
    .replaceAll("/", "--");
}

function repositoryUrl(repository) {
  if (typeof repository === "string") {
    return repository;
  }
  return repository?.url ?? "not specified";
}

export async function generateThirdPartyNotices({
  projectRoot,
  outputDirectory,
}) {
  const packageLock = JSON.parse(
    await readFile(path.join(projectRoot, "package-lock.json"), "utf8"),
  );
  const runtimePackages = Object.entries(packageLock.packages)
    .filter(
      ([packagePath, metadata]) =>
        packagePath.startsWith("node_modules/") &&
        metadata.dev !== true &&
        metadata.link !== true,
    )
    .sort(([left], [right]) => left.localeCompare(right));
  const noticesDirectory = path.join(outputDirectory, "third-party-licenses");
  await rm(noticesDirectory, { recursive: true, force: true });
  await mkdir(noticesDirectory, { recursive: true });

  const summary = [
    "Third-party software included in UCSB XRP Course Tools",
    "",
    "Each directory contains the package metadata and license or notice files shipped by that package.",
    "The MicroPython WebAssembly package omits its license file from npm, so its upstream MicroPython MIT license is supplied from vendor/licenses.",
    "",
  ];

  for (const [packagePath] of runtimePackages) {
    const sourceDirectory = path.join(projectRoot, packagePath);
    const packageMetadata = JSON.parse(
      await readFile(path.join(sourceDirectory, "package.json"), "utf8"),
    );
    const legalFilenames = (await readdir(sourceDirectory))
      .filter((filename) => LEGAL_FILENAME.test(filename))
      .sort();
    const destinationDirectory = path.join(
      noticesDirectory,
      packageDirectoryName(packagePath),
    );
    await mkdir(destinationDirectory, { recursive: true });

    if (legalFilenames.length === 0) {
      if (packagePath !== MICROPYTHON_PACKAGE) {
        throw new Error(
          `Runtime dependency ${packageMetadata.name} has no packaged license or notice file`,
        );
      }
      await cp(
        path.join(
          projectRoot,
          "vendor",
          "licenses",
          "micropython-webassembly-pyscript-LICENSE.txt",
        ),
        path.join(destinationDirectory, "LICENSE"),
      );
    } else {
      for (const filename of legalFilenames) {
        await cp(
          path.join(sourceDirectory, filename),
          path.join(destinationDirectory, filename),
        );
      }
    }
    const supplementalLicenses = path.join(sourceDirectory, "licenses");
    if ((await readdir(supplementalLicenses).catch(() => [])).length > 0) {
      await cp(
        supplementalLicenses,
        path.join(destinationDirectory, "licenses"),
        { recursive: true },
      );
    }

    const metadataText = [
      `name: ${packageMetadata.name}`,
      `version: ${packageMetadata.version}`,
      `license: ${packageMetadata.license ?? "see included files"}`,
      `repository: ${repositoryUrl(packageMetadata.repository)}`,
      "",
    ].join("\n");
    await writeFile(
      path.join(destinationDirectory, "PACKAGE.txt"),
      metadataText,
      "utf8",
    );
    summary.push(
      `${packageMetadata.name} ${packageMetadata.version} — ${packageMetadata.license ?? "see included files"}`,
    );
  }

  await writeFile(
    path.join(noticesDirectory, "README.txt"),
    `${summary.join("\n")}\n`,
    "utf8",
  );
}
