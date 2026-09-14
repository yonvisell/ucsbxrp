import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { seedWorkingFolder } from "./working-folder";

test("first-use creation checks numbered names, runs, saves, and reopens", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () =>
        (await navigator.storage.getDirectory()).getDirectoryHandle(
          "Documents",
          { create: true },
        ),
    });
  });
  await page.goto("/");
  await page.evaluate(async () => {
    const parent = await (
      await navigator.storage.getDirectory()
    ).getDirectoryHandle("Documents", { create: true });
    await parent.getDirectoryHandle("XRP_Project_01", { create: true });
  });
  const start = performance.now();
  await page.goto("/workspace/?mode=ide");
  const ide = page.frameLocator('iframe[title="UCSBXRP IDE"]');
  const dialog = ide.getByRole("dialog", { name: "Create your first Project" });
  await expect(dialog).toBeVisible();
  const firstDialogMs = performance.now() - start;
  await dialog
    .getByRole("button", { name: "Choose Working folder", exact: true })
    .click();
  await expect(dialog.getByLabel("Project folder name")).toHaveValue(
    "XRP_Project_02",
  );
  const creationStartedAt = performance.now();
  await dialog
    .getByRole("button", { name: "Create Project", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(ide.getByTestId("project-folder")).toHaveText("XRP_Project_02");
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  const creationToReadyMs = performance.now() - creationStartedAt;
  await ide.getByRole("button", { name: "Run", exact: true }).click();
  await expect(ide.getByTestId("target-status")).toContainText("running");
  const stop = performance.now();
  await ide.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(ide.getByTestId("target-status")).toContainText("ready");
  const stopLatencyMs = performance.now() - stop;
  await expect(ide.getByTestId("project-save-state")).toHaveText("Saved");
  // IDE-only workspace mode does not expose Monitor's run-status controls.
  // Check the actual source and any native writes before ordinary navigation.
  await expect
    .poll(async () =>
      page.evaluate(async () => {
        const parent = await (
          await navigator.storage.getDirectory()
        ).getDirectoryHandle("Documents");
        const project = await parent.getDirectoryHandle("XRP_Project_02");
        const metadata = JSON.parse(
          await (
            await (
              await project.getFileHandle(".ucsb-xrp-project.json")
            ).getFile()
          ).text(),
        );
        const writers: string[] = [];
        for (const directory of [parent, project]) {
          for await (const [name] of directory.entries()) {
            if (
              name === ".ucsb-xrp-writer.json" ||
              (name.startsWith(".ucsb-xrp-writer-") && name.endsWith(".json"))
            )
              writers.push(`${directory.name}/${name}`);
          }
        }
        const exists = async (
          directory: FileSystemDirectoryHandle,
          name: string,
        ) => {
          try {
            await directory.getFileHandle(name);
            return true;
          } catch (error) {
            if (error instanceof DOMException && error.name === "NotFoundError")
              return false;
            throw error;
          }
        };
        let pendingRun = false;
        try {
          pendingRun = await exists(
            await project.getDirectoryHandle("UCSB_XRP_Autosaves"),
            "pending-run.json",
          );
        } catch (error) {
          if (!(
            error instanceof DOMException && error.name === "NotFoundError"
          ))
            throw error;
        }
        return {
          id: Boolean(metadata.session?.projectId),
          provenance: Boolean(metadata.provenance?.origin?.creationRelease),
          writers,
          pendingProject: await exists(project, ".ucsb-xrp-commit.json"),
          pendingRun,
        };
      }),
    )
    .toEqual({
      id: true,
      provenance: true,
      writers: [],
      pendingProject: false,
      pendingRun: false,
    });
  const navigationWarnings: string[] = [];
  page.on("dialog", async (warning) => {
    navigationWarnings.push(warning.type());
    await warning.accept();
  });
  const reopenStartedAt = performance.now();
  await page.reload();
  expect(navigationWarnings).toEqual([]);
  await expect(ide.getByTestId("project-folder")).toHaveText("XRP_Project_02");
  await expect(dialog).toHaveCount(0);
  const rememberedFolderReopenMs = performance.now() - reopenStartedAt;
  expect(errors).toEqual([]);
  await testInfo.attach("first-use-metrics", {
    contentType: "application/json",
    body: JSON.stringify({
      totalMs: performance.now() - start,
      firstDialogMs,
      creationToReadyMs,
      rememberedFolderReopenMs,
      stopLatencyMs,
      browser: await page.evaluate(() => navigator.userAgent),
      folder: "browser OPFS with native directory handles; picker emulated",
    }),
  });
});

test("cancelled first-use picker keeps preview and a visible retry", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () => {
        throw new DOMException("Cancelled", "AbortError");
      },
    }),
  );
  await page.goto("/ide/");
  const dialog = page.getByRole("dialog", {
    name: "Create your first Project",
  });
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("button", { name: "Choose Working folder", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText(
    "No project was created",
  );
  await dialog.getByRole("button", { name: "Use read-only preview" }).click();
  await expect(dialog).toHaveCount(0);
  await page
    .getByRole("button", { name: "Create first Project", exact: true })
    .click();
  await expect(dialog).toBeVisible();
});

test("Guide and API preserve live workspace documents and Back restores help", async ({
  page,
}) => {
  await seedWorkingFolder(page, { folderName: "Documentation-Preservation" });
  await page.goto("/workspace/?mode=ide");
  const ide = page.frameLocator('iframe[title="UCSBXRP IDE"]');
  await expect(ide.getByTestId("target-status")).toContainText("ready");
  const initialDocument = await page
    .locator('iframe[title="UCSBXRP IDE"]')
    .evaluate(
      (element) =>
        (element as HTMLIFrameElement).contentWindow!.performance.timeOrigin,
    );
  await ide.getByRole("button", { name: "Run", exact: true }).click();
  await expect(ide.getByTestId("target-status")).toContainText("running");
  await page.getByRole("link", { name: "Guide", exact: true }).click();
  await expect(
    page.getByRole("complementary", { name: "Course documentation" }),
  ).toBeVisible();
  await expect(
    ide.getByRole("button", { name: "Stop", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "API", exact: true }).click();
  await expect(
    page
      .frameLocator('iframe[title="Course documentation"]')
      .getByRole("heading", { name: "UCSB XRP API reference", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close documentation" }).click();
  await page.goBack();
  await expect(
    page.getByRole("complementary", { name: "Course documentation" }),
  ).toBeVisible();
  expect(
    await page
      .locator('iframe[title="UCSBXRP IDE"]')
      .evaluate(
        (element) =>
          (element as HTMLIFrameElement).contentWindow!.performance.timeOrigin,
      ),
  ).toBe(initialDocument);
  await ide.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(ide.getByTestId("target-status")).toContainText("ready");
  await page.setViewportSize({ width: 650, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("blocked preferences and unavailable graphics preserve Monitor controls", async ({
  page,
}) => {
  await seedWorkingFolder(page, { folderName: "Capability-Failures" });
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (
        type === "webgl" ||
        type === "webgl2" ||
        type === "experimental-webgl"
      )
        return null;
      return Reflect.apply(getContext, this, [type, ...args]);
    } as typeof getContext;
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Storage blocked", "SecurityError");
      },
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/monitor/");
  await expect(
    page.getByText(/The World view needs WebGL graphics/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Retry World view" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reset", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("target-status")).toContainText("ready");
  expect(errors).toEqual([]);
});

test("worker startup failure keeps the IDE source and an actionable status", async ({
  page,
}) => {
  await seedWorkingFolder(page, { folderName: "Worker-Failure" });
  await page.addInitScript(() =>
    Object.defineProperty(window, "SharedWorker", {
      configurable: true,
      value: class {
        constructor() {
          throw new DOMException(
            "Shared workers are blocked by browser policy. Use a desktop Chrome profile that permits workers.",
            "SecurityError",
          );
        }
      },
    }),
  );
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/ide/");
  await expect(page.getByTestId("project-folder")).toHaveText(
    "Expanding-Spiral",
  );
  await expect(page.getByTestId("target-status")).toContainText("error");
  await expect(
    page.getByRole("button", { name: "Settings", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/Shared workers are blocked/).first(),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("failed note saves retain a downloadable copy and guard ordinary navigation", async ({
  page,
}) => {
  await seedWorkingFolder(page, { folderName: "Failed-Note-Save" });
  await page.goto("/monitor/");
  await expect(page.getByTestId("target-status")).toContainText("ready");
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect
    .poll(async () => {
      const text = await page.getByTestId("recording-count").textContent();
      return Number(
        text?.match(/([\d,]+) samples/)?.[1]?.replaceAll(",", "") ?? 0,
      );
    })
    .toBeGreaterThan(4);
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(page.getByTestId("run-autosave-status")).toContainText(
    "Saved automatically",
  );
  await page.evaluate(() => {
    const original = FileSystemFileHandle.prototype.createWritable;
    FileSystemFileHandle.prototype.createWritable = function (options) {
      if (this.name === "run-1.json")
        return Promise.reject(new Error("Disk withheld for regression"));
      return original.call(this, options);
    };
  });
  await page
    .getByTestId("wheel-speed-plot")
    .click({ button: "right", position: { x: 160, y: 60 } });
  await page.getByLabel("Note label").fill("Preserve this unsaved note");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByTestId("run-autosave-status")).toContainText(
    "Disk withheld for regression",
  );
  await expect(
    page.getByRole("button", { name: "Download retained notes" }),
  ).toBeVisible();
  const nextDialog = page.waitForEvent("dialog");
  const navigation = page.goto("/guide/").catch(() => undefined);
  const dialog = await nextDialog;
  expect(dialog.type()).toBe("beforeunload");
  await dialog.dismiss();
  await navigation;
  expect(page.url()).toContain("/monitor/");
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download retained notes" }).click();
  const download = await downloading;
  const recovered = JSON.parse(
    await readFile((await download.path())!, "utf8"),
  );
  expect(recovered.runId).toBeTruthy();
  expect(recovered.project.projectId).toBeTruthy();
  expect(recovered.annotations[0].label).toBe("Preserve this unsaved note");
});

test("Monitor Stop cancels a delayed standalone Project read before launch", async ({
  page,
}) => {
  await seedWorkingFolder(page, {
    folderName: "Cancelled-Monitor-Preparation",
    project: {
      name: "Cancelled preparation",
      entrypoint: "main.py",
      files: { "main.py": 'print("Unexpected delayed launch")\n' },
    },
  });
  await page.goto("/monitor/");
  await expect(
    page.getByRole("button", { name: "Run", exact: true }),
  ).toBeEnabled();
  await page.evaluate(() => {
    const state = window as typeof window & {
      __readBlocked?: boolean;
      __readFinished?: boolean;
      __releaseRead?: () => void;
    };
    const original = FileSystemFileHandle.prototype.getFile;
    let blockedOnce = false;
    FileSystemFileHandle.prototype.getFile = async function () {
      if (this.name === "main.py" && !blockedOnce) {
        blockedOnce = true;
        state.__readBlocked = true;
        await new Promise<void>((resolve) => {
          state.__releaseRead = resolve;
        });
        state.__readFinished = true;
      }
      return original.call(this);
    };
  });
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { __readBlocked?: boolean }).__readBlocked,
      ),
    )
    .toBe(true);
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await page.evaluate(() =>
    (
      window as typeof window & { __releaseRead?: () => void }
    ).__releaseRead?.(),
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { __readFinished?: boolean })
            .__readFinished,
      ),
    )
    .toBe(true);
  await expect(page.getByTestId("target-status")).toContainText("ready");
  await expect(
    page.getByRole("button", { name: "Run", exact: true }),
  ).toBeEnabled();
  await expect(page.getByTestId("recording-count")).toContainText(
    "Run a program to collect data.",
  );
  // Monitor exposes run datasets, not the IDE's Program-output log.
  await expect(
    page.getByRole("button", { name: "Export run data as CSV" }),
  ).toBeDisabled();
});
