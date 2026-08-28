import { readFileSync } from "node:fs";

import type { Page } from "@playwright/test";

export interface TestProject {
  name: string;
  entrypoint: string;
  files: Record<string, string>;
  templateId?: string;
}

export interface TestRobotRecord {
  id: string;
  name: string;
  networkMode: "station" | "access_point";
  ssid: string;
  address: string;
}

export interface TestWorkspaceOptions {
  folderName?: string;
  project?: TestProject;
  projectFolderName?: string;
  robot?: TestRobotRecord;
  target?: "virtual" | "physical";
}

function vendorFile(path: string): string {
  return readFileSync(
    new URL(`../../vendor/current/${path}`, import.meta.url),
    "utf8",
  );
}

export const expandingSpiralProject: TestProject = {
  name: "Expanding spiral",
  entrypoint: "main.py",
  templateId: "demo_spiral",
  files: Object.fromEntries(
    [
      "course_setup.py",
      "main.py",
      "README.md",
      "robot_config.py",
      "world.json",
    ].map((path) => [path, vendorFile(`templates/demo_spiral/${path}`)]),
  ),
};

/**
 * Give an end-to-end test the same persisted state as a student session:
 * one retained Working-folder capability in IndexedDB and one .ucsbxrp.json
 * file containing all serializable workspace and robot settings.
 */
export async function seedWorkingFolder(
  page: Page,
  options: TestWorkspaceOptions = {},
): Promise<void> {
  const folderName = options.folderName ?? "UCSBXRP-Test-Work";
  const project = options.project ?? expandingSpiralProject;
  const projectFolderName = options.projectFolderName ?? "Expanding-Spiral";
  const target = options.target ?? "virtual";

  await page.addInitScript((selectedFolderName) => {
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () =>
        (await navigator.storage.getDirectory()).getDirectoryHandle(
          selectedFolderName,
          { create: true },
        ),
    });
  }, folderName);

  // Storage APIs are origin-scoped, so establish the test origin before
  // creating the native File System Access handle retained by the app.
  await page.goto("/");
  await page.evaluate(
    async ({ folderName, project, projectFolderName, robot, target }) => {
      const root = await navigator.storage.getDirectory();
      try {
        await root.removeEntry(folderName, { recursive: true });
      } catch (error) {
        if (
          !(error instanceof DOMException) ||
          error.name !== "NotFoundError"
        ) {
          throw error;
        }
      }

      const workspace = await root.getDirectoryHandle(folderName, {
        create: true,
      });
      const projectFolder = await workspace.getDirectoryHandle(
        projectFolderName,
        { create: true },
      );
      const write = async (
        directory: FileSystemDirectoryHandle,
        name: string,
        content: string,
      ) => {
        const handle = await directory.getFileHandle(name, { create: true });
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
      };

      for (const [path, content] of Object.entries(project.files)) {
        const parts = path.split("/");
        const fileName = parts.pop()!;
        let directory = projectFolder;
        for (const part of parts) {
          directory = await directory.getDirectoryHandle(part, {
            create: true,
          });
        }
        await write(directory, fileName, content);
      }
      await write(
        projectFolder,
        ".ucsb-xrp-project.json",
        `${JSON.stringify({
          name: project.name,
          entrypoint: project.entrypoint,
          ...(project.templateId ? { templateId: project.templateId } : {}),
        })}\n`,
      );
      await write(
        workspace,
        ".ucsbxrp.json",
        `${JSON.stringify({
          schemaVersion: 1,
          activeProject: projectFolderName,
          ...(robot ? { robot } : {}),
          settings: { target },
        })}\n`,
      );

      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("ucsb-xrp-course-tools-v1", 1);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains("course-folders")) {
            request.result.createObjectStore("course-folders");
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction("course-folders", "readwrite");
        const store = transaction.objectStore("course-folders");
        store.clear();
        store.put(workspace, "workspace-folder-capability-v1");
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
      database.close();
    },
    { folderName, project, projectFolderName, robot: options.robot, target },
  );
}

export async function readWorkspaceManifest<T = unknown>(
  page: Page,
  folderName = "UCSBXRP-Test-Work",
): Promise<T> {
  return page.evaluate(async (name) => {
    const root = await navigator.storage.getDirectory();
    const workspace = await root.getDirectoryHandle(name);
    const handle = await workspace.getFileHandle(".ucsbxrp.json");
    return JSON.parse(await (await handle.getFile()).text()) as T;
  }, folderName);
}

export async function replaceWorkspaceProject(
  page: Page,
  project: TestProject,
  options: {
    folderName?: string;
    projectFolderName?: string;
  } = {},
): Promise<void> {
  const folderName = options.folderName ?? "UCSBXRP-Test-Work";
  const projectFolderName = options.projectFolderName ?? "Expanding-Spiral";
  await page.evaluate(
    async ({ folderName, projectFolderName, project }) => {
      const root = await navigator.storage.getDirectory();
      const workspace = await root.getDirectoryHandle(folderName);
      const folder = await workspace.getDirectoryHandle(projectFolderName);
      for await (const [name, handle] of folder.entries()) {
        if (handle.kind === "file") await folder.removeEntry(name);
      }
      const write = async (name: string, content: string) => {
        const handle = await folder.getFileHandle(name, { create: true });
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
      };
      for (const [name, content] of Object.entries(project.files)) {
        await write(name, content);
      }
      await write(
        ".ucsb-xrp-project.json",
        `${JSON.stringify({
          name: project.name,
          entrypoint: project.entrypoint,
          ...(project.templateId ? { templateId: project.templateId } : {}),
        })}\n`,
      );
    },
    { folderName, projectFolderName, project },
  );
}

export interface TestExportFile {
  name: string;
  byteLength: number;
  text: string | null;
}

export async function readWorkspaceExports(
  page: Page,
  options: {
    folderName?: string;
    projectFolderName?: string;
  } = {},
): Promise<TestExportFile[]> {
  return page.evaluate(
    async ({ folderName, projectFolderName }) => {
      const root = await navigator.storage.getDirectory();
      const workspace = await root.getDirectoryHandle(folderName);
      const project = await workspace.getDirectoryHandle(projectFolderName);
      let exportsFolder: FileSystemDirectoryHandle;
      try {
        exportsFolder = await project.getDirectoryHandle("exports");
      } catch (error) {
        if (error instanceof DOMException && error.name === "NotFoundError") {
          return [];
        }
        throw error;
      }
      const files: TestExportFile[] = [];
      for await (const [name, handle] of exportsFolder.entries()) {
        if (handle.kind !== "file") continue;
        const file = await handle.getFile();
        files.push({
          name,
          byteLength: file.size,
          text: /\.(?:csv|svg)$/i.test(name) ? await file.text() : null,
        });
      }
      return files.sort((left, right) => left.name.localeCompare(right.name));
    },
    {
      folderName: options.folderName ?? "UCSBXRP-Test-Work",
      projectFolderName: options.projectFolderName ?? "Expanding-Spiral",
    },
  );
}
