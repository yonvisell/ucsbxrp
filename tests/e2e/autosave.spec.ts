import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

import { seedWorkingFolder, type TestProject } from "./working-folder";

function challengeFile(path: string): string {
  return readFileSync(
    new URL(
      `../../vendor/current/starters/challenge_1/${path}`,
      import.meta.url,
    ),
    "utf8",
  );
}

const challengeOne: TestProject = {
  name: "1 · Straight Run",
  entrypoint: "main.py",
  templateId: "challenge_1",
  files: Object.fromEntries(
    [
      "challenge.py",
      "component_checks.py",
      "course_setup.py",
      "main.py",
      "README.md",
      "robot_config.py",
      "sensor_model.py",
      "wheel_speed_controller.py",
      "world.json",
    ].map((path) => [path, challengeFile(path)]),
  ),
};

async function readFolderFiles(page: Page, rootName: string) {
  const snapshot = await page.evaluate(async (selectedRootName) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("ucsb-xrp-course-tools-v1", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const selected = await new Promise<FileSystemDirectoryHandle>(
      (resolve, reject) => {
        const transaction = database.transaction("course-folders", "readonly");
        const request = transaction
          .objectStore("course-folders")
          .get("workspace-folder-capability-v1");
        request.onsuccess = () => {
          const handle = request.result as
            FileSystemDirectoryHandle | undefined;
          if (handle) resolve(handle);
          else reject(new Error("The retained Working folder is unavailable"));
        };
        request.onerror = () => reject(request.error);
      },
    );
    database.close();
    if (selected.name !== selectedRootName) {
      throw new Error(
        `Expected retained Working folder ${selectedRootName}; received ${selected.name}`,
      );
    }
    const transientReads: string[] = [];
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      // Enumeration is not a native snapshot. Restart the complete read when
      // an in-flight save removes an entry; never return a partial file set.
      const files: Record<string, string> = {};
      let operation = `enumerating ${selectedRootName}/`;
      const read = async (folder: FileSystemDirectoryHandle, prefix = "") => {
        operation = `enumerating ${selectedRootName}/${prefix}`;
        for await (const [name, handle] of folder.entries()) {
          const path = `${prefix}${name}`;
          if (handle.kind === "directory") {
            await read(handle, `${path}/`);
          } else if (
            name === ".ucsb-xrp-commit.json" ||
            name === ".ucsb-xrp-writer.json" ||
            (name.startsWith(".ucsb-xrp-writer-") && name.endsWith(".json"))
          ) {
            // Presence alone is sufficient to keep this poll pending.
            files[path] = "";
          } else {
            operation = `getting file ${selectedRootName}/${path}`;
            const file = await handle.getFile();
            operation = `reading bytes ${selectedRootName}/${path}`;
            files[path] = await file.text();
          }
          operation = `enumerating ${selectedRootName}/${prefix}`;
        }
      };
      try {
        await read(selected);
        return { files, transientReads };
      } catch (error) {
        if (!(error instanceof DOMException) || error.name !== "NotFoundError")
          throw error;
        transientReads.push(`Attempt ${attempt}: ${operation}`);
        if (attempt === 5)
          throw new Error(
            `Working-folder scan did not settle after five attempts: ${transientReads.join("; ")}. ${error.message}`,
          );
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
    }
    throw new Error("Working-folder scan exhausted its attempts");
  }, rootName);
  if (snapshot.transientReads.length)
    await test.info().attach("transient-folder-scan-reads", {
      body: JSON.stringify(snapshot.transientReads, null, 2),
      contentType: "application/json",
    });
  return snapshot.files;
}

test("automatically saves current bytes and retains four interval checkpoints", async ({
  page: ide,
}) => {
  await ide.addInitScript(() => {
    const realNow = Date.now.bind(Date);
    let offset = 0;
    Date.now = () => realNow() + offset;
    (
      window as unknown as { advanceCheckpointInterval: () => void }
    ).advanceCheckpointInterval = () => {
      offset += 60_001;
    };
  });
  await seedWorkingFolder(ide, { folderName: "Autosave-Edits" });
  await ide.goto("/ide/");
  await expect(ide.getByTestId("project-save-state")).toHaveText("Saved");

  const projectPrefix = "Expanding-Spiral/";
  const mainPath = `${projectPrefix}main.py`;
  const checkpointPrefix = `${projectPrefix}UCSB_XRP_Autosaves/project-`;
  const original = (await readFolderFiles(ide, "Autosave-Edits"))[mainPath]!;
  const source = (revision: number) =>
    `# Student revision ${revision}\nprint("revision ${revision}")\n`;
  const editor = ide.getByRole("textbox", { name: "main.py editor" });
  const saveDurations: { revision: number; elapsedMs: number }[] = [];
  const saveRevision = async (revision: number) => {
    await editor.focus();
    await editor.press("ControlOrMeta+A");
    const started = performance.now();
    await ide.keyboard.insertText(source(revision));
    await expect
      .poll(async () => {
        const saved = await readFolderFiles(ide, "Autosave-Edits");
        return {
          source: saved[mainPath],
          pending: Object.keys(saved).some(
            (path) =>
              path === `${projectPrefix}.ucsb-xrp-commit.json` ||
              path === `${projectPrefix}.ucsb-xrp-writer.json` ||
              path.startsWith(`${projectPrefix}.ucsb-xrp-writer-`),
          ),
        };
      })
      .toEqual({ source: source(revision), pending: false });
    await expect(ide.getByTestId("project-save-state")).toHaveText("Saved");
    saveDurations.push({
      revision,
      elapsedMs: Number((performance.now() - started).toFixed(2)),
    });
  };
  const checkpoints = async () => {
    const saved = await readFolderFiles(ide, "Autosave-Edits");
    return Object.keys(saved)
      .filter(
        (path) => path.startsWith(checkpointPrefix) && path.endsWith(".json"),
      )
      .sort()
      .map(
        (path) =>
          (
            JSON.parse(saved[path]!) as {
              project: { files: Record<string, string> };
            }
          ).project.files["main.py"],
      );
  };

  for (let revision = 1; revision <= 5; revision += 1)
    await saveRevision(revision);
  // Ordinary edit bursts keep the complete preceding checkpoint instead of
  // consuming the history with one nearly identical entry for each edit.
  expect(await checkpoints()).toEqual([original]);
  for (let revision = 6; revision <= 9; revision += 1) {
    // Advance wall time only after source, commit journal and writer are idle.
    // Real time and timers keep moving, including writer admission deadlines.
    await ide.evaluate(() =>
      (
        window as unknown as { advanceCheckpointInterval: () => void }
      ).advanceCheckpointInterval(),
    );
    await saveRevision(revision);
    const retained = await checkpoints();
    expect(retained.length).toBeLessThanOrEqual(4);
    if (revision === 8)
      expect(retained).toEqual([source(7), source(6), source(5), original]);
  }
  expect(await checkpoints()).toEqual([
    source(8),
    source(7),
    source(6),
    source(5),
  ]);
  expect((await readFolderFiles(ide, "Autosave-Edits"))[mainPath]).toBe(
    source(9),
  );
  const timingPath = test.info().outputPath("autosave-edit-latency.json");
  await writeFile(
    timingPath,
    JSON.stringify(
      {
        fixture: "Chrome origin-private filesystem (OPFS); not native disk",
        measurement:
          "Monotonic test clock from inserting the edit through exact persisted source, absent commit/writer records, and visible Saved confirmation. Includes debounce, UI, persistence, and assertion polling latency.",
        saveDurations,
      },
      null,
      2,
    ) + "\n",
  );
  await test.info().attach("autosave-edit-latency", {
    path: timingPath,
    contentType: "application/json",
  });
});

test("Monitor runs the saved Project and autosaves output with telemetry", async ({
  page: monitor,
}) => {
  test.setTimeout(40_000);
  await seedWorkingFolder(monitor, {
    folderName: "Autosave-Run",
    project: challengeOne,
    projectFolderName: "1-Straight-Run",
  });
  await monitor.goto("/monitor/");

  const run = monitor.getByRole("button", { name: "Run", exact: true });
  await expect(run).toBeEnabled();
  await expect(run).toHaveAttribute("title", /1 · Straight Run/);
  await run.click();
  await expect(monitor.getByTestId("run-autosave-status")).toHaveText(
    "Saved automatically to 1-Straight-Run.",
    { timeout: 20_000 },
  );

  const saved = await readFolderFiles(monitor, "Autosave-Run");
  expect(saved["1-Straight-Run/UCSB_XRP_Autosaves/run-1.txt"]).toContain(
    "Challenge 1 complete",
  );
  const csv = saved["1-Straight-Run/UCSB_XRP_Autosaves/telemetry-1.csv"] ?? "";
  expect(csv.split("\n")[0]).toContain("left_wheel_speed_mm_s");
  expect(csv.split("\n").length).toBeGreaterThan(2);
  const metadata = JSON.parse(
    saved["1-Straight-Run/UCSB_XRP_Autosaves/run-1.json"] ?? "{}",
  ) as {
    target?: string;
    project?: { name?: string };
    telemetrySamples?: number;
  };
  expect(metadata.target).toBe("virtual");
  expect(metadata.project?.name).toBe("1 · Straight Run");
  expect(metadata.telemetrySamples).toBeGreaterThan(0);
});
