import { readFileSync } from "node:fs";

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
  return page.evaluate(async (selectedRootName) => {
    const files: Record<string, string> = {};
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
    const read = async (folder: FileSystemDirectoryHandle, prefix = "") => {
      for await (const [name, handle] of folder.entries()) {
        const path = `${prefix}${name}`;
        if (handle.kind === "directory") {
          await read(handle, `${path}/`);
        } else {
          files[path] = await (await handle.getFile()).text();
        }
      }
    };
    await read(selected);
    return files;
  }, rootName);
}

test("automatically saves edits and retains four prior project states", async ({
  page: ide,
}) => {
  await seedWorkingFolder(ide, { folderName: "Autosave-Edits" });
  await ide.goto("/ide/");
  await expect(ide.getByTestId("project-save-state")).toHaveText("Saved");

  for (let revision = 1; revision <= 5; revision += 1) {
    const path = `notes/revision_${revision}.txt`;
    await ide.getByRole("button", { name: "New file…", exact: true }).click();
    await ide.getByLabel("Project-relative path").fill(path);
    await ide.getByRole("button", { name: "Create file" }).click();
    await expect
      .poll(() =>
        ide.evaluate(
          async ({ path }) => {
            const root = await navigator.storage.getDirectory();
            const workspace = await root.getDirectoryHandle("Autosave-Edits");
            const project =
              await workspace.getDirectoryHandle("Expanding-Spiral");
            const [directoryName, fileName] = path.split("/");
            try {
              const directory = await project.getDirectoryHandle(
                directoryName!,
              );
              await directory.getFileHandle(fileName!);
              return true;
            } catch {
              return false;
            }
          },
          { path },
        ),
      )
      .toBe(true);
  }

  const saved = await readFolderFiles(ide, "Autosave-Edits");
  expect(saved["Expanding-Spiral/notes/revision_5.txt"]).toBe("");
  const newestPrior = JSON.parse(
    saved["Expanding-Spiral/UCSB_XRP_Autosaves/project-1.json"] ?? "{}",
  ) as { project?: { files?: Record<string, string> } };
  const oldestPrior = JSON.parse(
    saved["Expanding-Spiral/UCSB_XRP_Autosaves/project-4.json"] ?? "{}",
  ) as { project?: { files?: Record<string, string> } };
  expect(newestPrior.project?.files?.["notes/revision_4.txt"]).toBe("");
  expect(newestPrior.project?.files?.["notes/revision_5.txt"]).toBeUndefined();
  expect(oldestPrior.project?.files?.["notes/revision_1.txt"]).toBe("");
  expect(oldestPrior.project?.files?.["notes/revision_2.txt"]).toBeUndefined();
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
