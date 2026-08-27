import { expect, test, type Page } from "@playwright/test";

function numericValue(text: string | null): number {
  return Number.parseFloat(text ?? "NaN");
}

const boundedVirtualMotionProgram = `from time import sleep_ms
from ucsb_xrp import DriveCommand, RobotConfig, XRPBot

bot = XRPBot(RobotConfig(max_drive_command=0.65))
try:
    bot.set_drive(DriveCommand(0.58, 0.52))
    sleep_ms(1800)
finally:
    bot.stop()

print("Virtual run complete")
`;

function collectBrowserErrors(page: Page, errors: string[] = []): string[] {
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  return errors;
}

test("edits a multi-file project and completes the virtual XRP workflow", async ({
  context,
  page: ide,
}) => {
  const browserErrors = collectBrowserErrors(ide);

  await ide.addInitScript((program: string) => {
    const savedFiles: Record<string, string> = {};

    localStorage.setItem(
      "ucsb-xrp-course-project-v2",
      JSON.stringify({
        name: "virtual-browser-check",
        entrypoint: "main.py",
        files: { "main.py": program },
      }),
    );

    class FakeFileHandle {
      readonly kind = "file";

      constructor(
        readonly name: string,
        private readonly path: string,
      ) {}

      async getFile() {
        return new File([savedFiles[this.path] ?? ""], this.name);
      }

      async createWritable() {
        return {
          write: async (content: string) => {
            savedFiles[this.path] = String(content);
          },
          close: async () => undefined,
        };
      }
    }

    class FakeDirectoryHandle {
      readonly kind = "directory";

      constructor(
        readonly name: string,
        private readonly prefix = "",
      ) {}

      async *entries() {
        const directories = new Set<string>();
        for (const path of Object.keys(savedFiles).sort()) {
          if (!path.startsWith(this.prefix)) {
            continue;
          }
          const remainder = path.slice(this.prefix.length);
          const slash = remainder.indexOf("/");
          if (slash < 0) {
            yield [remainder, new FakeFileHandle(remainder, path)] as const;
            continue;
          }
          const directory = remainder.slice(0, slash);
          if (!directories.has(directory)) {
            directories.add(directory);
            yield [
              directory,
              new FakeDirectoryHandle(directory, `${this.prefix}${directory}/`),
            ] as const;
          }
        }
      }

      async getDirectoryHandle(name: string, options?: { create?: boolean }) {
        const prefix = `${this.prefix}${name}/`;
        if (
          !options?.create &&
          !Object.keys(savedFiles).some((path) => path.startsWith(prefix))
        ) {
          throw new DOMException("Directory not found", "NotFoundError");
        }
        return new FakeDirectoryHandle(name, prefix);
      }

      async getFileHandle(name: string, options?: { create?: boolean }) {
        const path = `${this.prefix}${name}`;
        if (!options?.create && !(path in savedFiles)) {
          throw new DOMException("File not found", "NotFoundError");
        }
        return new FakeFileHandle(name, path);
      }

      async removeEntry(name: string) {
        const path = `${this.prefix}${name}`;
        if (!(path in savedFiles)) {
          throw new DOMException("File not found", "NotFoundError");
        }
        delete savedFiles[path];
      }
    }

    Object.defineProperty(window, "__savedCourseFiles", {
      value: savedFiles,
    });
    Object.defineProperty(window, "showDirectoryPicker", {
      value: async (options?: { id?: string }) =>
        options?.id === "ucsb-xrp-project" &&
        Object.keys(savedFiles).some((path) =>
          path.startsWith("virtual-browser-check/"),
        )
          ? new FakeDirectoryHandle(
              "virtual-browser-check",
              "virtual-browser-check/",
            )
          : new FakeDirectoryHandle("browser-course-workspace"),
    });
  }, boundedVirtualMotionProgram);

  await ide.goto("/ide/");
  const dashboard = await context.newPage();
  collectBrowserErrors(dashboard, browserErrors);
  await dashboard.goto("/monitor/");

  const ideStatus = ide.getByTestId("target-status");
  const dashboardStatus = dashboard.getByTestId("target-status");
  await expect(ideStatus).toContainText("Virtual XRP · ready");
  await expect(dashboardStatus).toContainText("Virtual XRP · ready");
  const [
    targetSelectBox,
    ideRunBox,
    ideHeaderBox,
    ideBrandBox,
    settingsBox,
    targetStatusBox,
  ] = await Promise.all([
    ide.getByLabel("Run on").boundingBox(),
    ide.getByRole("button", { name: "Run", exact: true }).boundingBox(),
    ide.locator(".app-header").boundingBox(),
    ide.locator(".brand").boundingBox(),
    ide.getByRole("button", { name: "Settings", exact: true }).boundingBox(),
    ide.getByTestId("target-status").boundingBox(),
  ]);
  expect(targetSelectBox?.height).toBe(ideRunBox?.height);
  expect(targetSelectBox?.height).toBe(19);
  expect(ideHeaderBox?.height).toBeLessThanOrEqual(29);
  expect(
    (targetSelectBox?.x ?? 0) -
      (ideBrandBox?.x ?? 0) -
      (ideBrandBox?.width ?? 0),
  ).toBeGreaterThanOrEqual(7);
  expect(settingsBox?.x).toBeGreaterThan(
    (targetStatusBox?.x ?? 0) + (targetStatusBox?.width ?? 0) - 1,
  );
  expect(
    (ideHeaderBox?.width ?? 0) -
      ((settingsBox?.x ?? 0) + (settingsBox?.width ?? 0)),
  ).toBeLessThanOrEqual(8);
  const ideHeaderColors = await ide
    .locator(".app-header")
    .evaluate((header) => {
      const mark = header.querySelector<HTMLElement>(".brand-mark")!;
      const run = [
        ...header.querySelectorAll<HTMLButtonElement>("button"),
      ].find((button) => button.textContent?.trim() === "Run")!;
      return {
        mark: getComputedStyle(mark).color,
        run: getComputedStyle(run).backgroundColor,
      };
    });
  expect(ideHeaderColors).toEqual({
    mark: "rgb(0, 88, 138)",
    run: "rgb(238, 240, 242)",
  });
  await ide.getByRole("button", { name: "Expand output" }).click();
  await ide.getByRole("tab", { name: "Status" }).click();
  const conciseStatus = ide.locator(".status-grid");
  await expect(
    conciseStatus.getByText("Validation", { exact: true }),
  ).toBeVisible();
  await expect(
    conciseStatus.getByText("Not checked", { exact: true }),
  ).toBeVisible();
  await expect(
    conciseStatus.getByText("Project", { exact: true }),
  ).toBeVisible();
  await expect(conciseStatus.getByText("virtual-browser-check")).toBeVisible();
  await expect(
    conciseStatus.getByText("File operation", { exact: true }),
  ).toHaveCount(0);
  await expect(dashboard.getByRole("log")).toHaveCount(0);
  const worldDimensions = await dashboard
    .getByTestId("world-view")
    .evaluate((element) => ({
      canvasWidth: element.querySelector("canvas")?.clientWidth ?? 0,
      hostWidth: element.clientWidth,
    }));
  expect(worldDimensions.hostWidth).toBeGreaterThan(100);
  expect(worldDimensions.hostWidth).toBeLessThan(1_500);
  expect(worldDimensions.canvasWidth).toBe(worldDimensions.hostWidth);
  await expect(dashboard.getByTestId("world-view")).toHaveAttribute(
    "data-xrp-footprint-mm",
    "192.5 × 190.5",
  );
  await expect(dashboard.getByTestId("world-view")).toHaveAttribute(
    "data-arena-mm",
    "2400 × 1800",
  );
  await expect(
    dashboard.getByText(/Major grid lines and values are labeled/),
  ).toContainText("500 millimeters");
  await expect(
    dashboard.getByLabel(
      "World line legend: green is path; ochre is ultrasound distance",
    ),
  ).toBeVisible();
  await expect(
    dashboard.getByRole("heading", { name: "Live telemetry" }),
  ).toBeVisible();
  await expect(
    dashboard.getByTestId("world-view").getByText(/virtual pose/i),
  ).toHaveCount(0);
  const [worldLabelBox, sceneSelectBox] = await Promise.all([
    dashboard.getByText("World", { exact: true }).boundingBox(),
    dashboard.getByLabel("World configuration").boundingBox(),
  ]);
  expect(
    Math.abs((sceneSelectBox?.y ?? 0) - (worldLabelBox?.y ?? 0)),
  ).toBeLessThanOrEqual(4);
  expect(sceneSelectBox?.x).toBeGreaterThan(
    (worldLabelBox?.x ?? 0) + (worldLabelBox?.width ?? 0),
  );
  const telemetryLabels = await dashboard
    .locator(".live-values dt")
    .allTextContents();
  for (const label of [
    "USER button",
    "motor supply",
    "IMU temperature",
    "encoder counts L/R",
  ]) {
    expect(telemetryLabels.indexOf(label)).toBeGreaterThan(
      telemetryLabels.indexOf("yaw rate ωz"),
    );
  }
  await dashboard.getByRole("button", { name: "Zoom XRP" }).click();
  await expect(
    dashboard.getByRole("button", { name: "Fit world" }),
  ).toBeVisible();
  await dashboard.getByRole("button", { name: "Fit world" }).click();

  await ide.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(ide.getByTestId("settings-panel")).toBeVisible();
  await expect(ide.getByLabel(/Editor font size/)).toHaveValue("9");
  await expect(ide.getByLabel(/Editor font size/)).toHaveAttribute("min", "8");
  await expect(ide.getByLabel(/Output font size/)).toHaveAttribute("min", "8");
  await expect(ide.getByLabel("Code overview")).toHaveValue("off");
  await ide.getByLabel(/Editor font size/).fill("12");
  await ide.getByRole("button", { name: "Close settings" }).click();

  await ide.getByRole("button", { name: "New file", exact: true }).click();
  await ide
    .getByLabel("Project-relative path")
    .fill("student/straight_line_controller.py");
  await ide.getByRole("button", { name: "Create file" }).click();
  await expect(
    ide.getByRole("tab", { name: "straight_line_controller.py" }),
  ).toBeVisible();
  await ide.getByRole("button", { name: "Open main.py (main file)" }).click();

  await ide.getByRole("button", { name: "Validate" }).click();
  await expect(ide.getByTestId("check-result")).toContainText(
    "Python files compiled with MicroPython",
  );

  await ide.getByRole("button", { name: "Run", exact: true }).click();
  await expect(ideStatus).toContainText("Virtual XRP · running");
  await expect(dashboardStatus).toContainText("Virtual XRP · running");
  await expect
    .poll(
      async () =>
        numericValue(await dashboard.getByTestId("x-mm").textContent()),
      {
        message: "virtual XRP should translate after drive command is applied",
      },
    )
    .toBeGreaterThan(10);

  await expect(ide.getByRole("log")).toContainText("Virtual run complete");
  await expect(ideStatus).toContainText("Virtual XRP · ready");
  await expect(dashboard.getByTestId("motor-effort")).toHaveText("0.00 / 0.00");
  await expect
    .poll(
      async () =>
        Math.abs(
          numericValue(await dashboard.getByTestId("left-speed").textContent()),
        ),
      {
        message: "zero effort should coast to a finite stopped wheel state",
        timeout: 5_000,
      },
    )
    .toBeLessThan(0.1);

  const monitorRun = dashboard
    .locator(".app-header")
    .getByRole("button", { name: "Run", exact: true });
  await expect(monitorRun).toBeEnabled();

  await ide.getByRole("button", { name: "New file", exact: true }).click();
  await ide.getByLabel("Project-relative path").fill("notes.md");
  await ide.getByRole("button", { name: "Create file" }).click();
  await expect(monitorRun).toBeEnabled();
  await expect(monitorRun).toHaveAttribute(
    "title",
    /Validate and run the current IDE project/,
  );

  await ide.getByRole("button", { name: "Run", exact: true }).click();
  await expect(dashboardStatus).toContainText("Virtual XRP · running");
  await expect(ide.getByRole("log")).toContainText("Virtual run complete");
  await ide.getByRole("tab", { name: "Status" }).click();
  await expect(ide.getByTestId("check-result")).toContainText(
    "Python files compiled with MicroPython",
  );
  await ide.getByRole("tab", { name: /System log/ }).click();
  await dashboard
    .locator(".app-header")
    .getByRole("button", { name: "Stop", exact: true })
    .click();
  await expect(ide.getByRole("log")).toContainText(
    "Run stopped; drive command set to zero",
  );
  await expect(ideStatus).toContainText("Virtual XRP · ready");

  await expect(monitorRun).toBeEnabled();
  await monitorRun.click();
  await expect(ideStatus).toContainText("Virtual XRP · running");
  await dashboard
    .locator(".app-header")
    .getByRole("button", { name: "Stop", exact: true })
    .click();
  await expect(ideStatus).toContainText("Virtual XRP · ready");

  await dashboard
    .locator(".app-header")
    .getByRole("button", { name: "Reset", exact: true })
    .click();
  await expect(dashboard.getByTestId("x-mm")).toHaveText("0.0 mm");
  await expect(dashboard.getByTestId("motor-effort")).toHaveText("0.00 / 0.00");

  await ide
    .getByRole("button", { name: "Choose working folder", exact: true })
    .click();
  await ide.getByLabel("Folder name").fill("virtual-browser-check");
  await ide
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await ide.getByRole("tab", { name: "Status" }).click();
  await expect(ide.locator(".project-operation-detail")).toHaveText(
    "Created ./virtual-browser-check. Edits and monitored runs save there automatically.",
  );
  const savedController = await ide.evaluate(
    () =>
      (
        window as unknown as {
          __savedCourseFiles: Record<string, string>;
        }
      ).__savedCourseFiles[
        "virtual-browser-check/student/straight_line_controller.py"
      ],
  );
  expect(savedController).toBe("");
  await ide.getByRole("button", { name: "Open project" }).click();
  await expect(ide.locator(".project-operation-detail")).toHaveText(
    /Opened project folder virtual-browser-check: \d+ supported files?(?:; \d+ items? skipped)?\./,
  );

  await ide
    .getByRole("button", {
      name: "Open student/straight_line_controller.py",
    })
    .click();
  await ide
    .getByRole("button", { name: /File straight_line_controller\.py/ })
    .click();
  await ide
    .getByRole("button", { name: "Duplicate file", exact: true })
    .click();
  await expect(ide.getByLabel("Project-relative path")).toHaveValue(
    "student/straight_line_controller_copy.py",
  );
  await ide
    .getByRole("dialog")
    .getByRole("button", { name: "Duplicate file" })
    .click();
  await ide
    .getByRole("button", { name: /File straight_line_controller_copy\.py/ })
    .click();
  await ide.getByRole("button", { name: "Rename file", exact: true }).click();
  await ide
    .getByLabel("Project-relative path")
    .fill("student/controller_experiment.py");
  await ide
    .getByRole("dialog")
    .getByRole("button", { name: "Rename file" })
    .click();
  await ide
    .getByRole("button", { name: /File controller_experiment\.py/ })
    .click();
  await ide.getByRole("button", { name: "Make main" }).click();
  await expect(
    ide.getByRole("button", {
      name: "Open student/controller_experiment.py (main file)",
    }),
  ).toBeVisible();
  await ide.getByRole("button", { name: "Open main.py" }).click();
  await ide.getByRole("button", { name: /File main\.py/ }).click();
  await ide.getByRole("button", { name: "Make main" }).click();
  await ide.keyboard.press("Meta+s");
  await ide
    .getByRole("button", { name: "Open student/controller_experiment.py" })
    .click();
  await ide
    .getByRole("button", { name: /File controller_experiment\.py/ })
    .click();
  await ide.getByRole("button", { name: "Delete file", exact: true }).click();
  await expect(
    ide.getByRole("heading", {
      name: "Delete student/controller_experiment.py?",
    }),
  ).toBeVisible();
  const keepFileButton = ide.getByRole("button", { name: "Keep file" });
  const deleteFileButton = ide
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete file" });
  await expect(keepFileButton).toBeFocused();
  await keepFileButton.press("Shift+Tab");
  await expect(deleteFileButton).toBeFocused();
  await deleteFileButton.press("Tab");
  await expect(keepFileButton).toBeFocused();
  await deleteFileButton.click();
  await ide.keyboard.press("Meta+s");
  await expect(ide.locator(".project-operation-detail")).toHaveText(
    /removed 1 deleted file/,
  );
  const savedProjectState = await ide.evaluate(() => {
    const saved = (
      window as unknown as {
        __savedCourseFiles: Record<string, string>;
      }
    ).__savedCourseFiles;
    return {
      deletedCopy:
        saved["virtual-browser-check/student/controller_experiment.py"],
      keys: Object.keys(saved).sort(),
      metadata: saved["virtual-browser-check/.ucsb-xrp-project.json"],
    };
  });
  expect(savedProjectState.keys).not.toContain(
    "virtual-browser-check/student/controller_experiment.py",
  );
  expect(savedProjectState.deletedCopy).toBeUndefined();
  expect(savedProjectState.metadata).toBeDefined();
  expect(JSON.parse(savedProjectState.metadata!)).toMatchObject({
    name: "virtual-browser-check",
    entrypoint: "main.py",
    session: {
      projectId: expect.any(String),
      revision: expect.any(Number),
      savedRevision: expect.any(Number),
      updatedAt: expect.any(Number),
    },
  });

  const guide = await context.newPage();
  collectBrowserErrors(guide, browserErrors);
  await guide.goto("/guide/");
  await expect(
    guide.getByRole("heading", {
      name: "Physical XRP",
    }),
  ).toBeVisible();
  await expect(
    guide.getByRole("heading", {
      name: "Project files, units, and data flow",
    }),
  ).toBeVisible();
  const apiReference = await context.newPage();
  collectBrowserErrors(apiReference, browserErrors);
  await apiReference.goto("/reference/#records");
  await expect(
    apiReference.getByText("DriveCommand(left, right)", { exact: true }),
  ).toBeVisible();

  expect(browserErrors).toEqual([]);
});

test("abandons a virtual run safely when its IDE owner disappears", async ({
  context,
  page: ide,
}) => {
  const browserErrors = collectBrowserErrors(ide);
  await ide.addInitScript(() => {
    localStorage.setItem(
      "ucsb-xrp-course-project-v2",
      JSON.stringify({
        name: "owner-lease-proof",
        entrypoint: "main.py",
        files: {
          "main.py": `from time import sleep_ms
from ucsb_xrp import DriveCommand, RobotConfig, XRPBot

bot = XRPBot(RobotConfig(max_drive_command=0.65))
bot.set_drive(DriveCommand(0.6, 0.6))
while True:
    sleep_ms(1000)
`,
          "README.md": "This non-Python file must not be compiled as Python.",
        },
      }),
    );
  });

  await ide.goto("/ide/");
  const monitor = await context.newPage();
  collectBrowserErrors(monitor, browserErrors);
  await monitor.goto("/monitor/");
  expect(browserErrors).toEqual([]);

  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await ide.getByRole("button", { name: "Validate" }).click();
  await expect(ide.getByTestId("check-result")).toContainText(
    "1 Python file compiled with MicroPython",
  );

  await ide.getByRole("button", { name: "Run", exact: true }).click();
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · running",
  );
  await expect
    .poll(
      async () => numericValue(await monitor.getByTestId("x-mm").textContent()),
      { message: "virtual XRP should move before its run owner is removed" },
    )
    .toBeGreaterThan(10);

  await ide.close();

  await expect
    .poll(
      async () => await monitor.getByTestId("target-status").textContent(),
      { timeout: 5_000 },
    )
    .not.toContain("running");
  await expect(monitor.getByTestId("motor-effort")).toHaveText("0.00 / 0.00");
  const terminal = await context.newPage();
  collectBrowserErrors(terminal, browserErrors);
  await terminal.goto("/ide/");
  await terminal.getByRole("tab", { name: /System log/ }).click();
  await expect(terminal.getByRole("log")).toContainText(
    "drive command set to zero",
  );
  expect(browserErrors).toEqual([]);
});

test("keeps project and output controls usable on a narrow screen", async ({
  page: ide,
}) => {
  const browserErrors = collectBrowserErrors(ide);
  await ide.setViewportSize({ width: 375, height: 800 });
  await ide.goto("/ide/");
  expect(browserErrors).toEqual([]);
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  const showProjectFiles = ide.getByRole("button", {
    name: "Project ›",
  });
  await expect(showProjectFiles).toBeVisible();
  await showProjectFiles.click();
  await expect(
    ide.getByRole("complementary", { name: "Project" }),
  ).toBeVisible();
  await ide.getByRole("button", { name: "Collapse project" }).click();
  await expect(showProjectFiles).toBeVisible();

  await expect(
    ide.getByRole("button", { name: "Expand output" }),
  ).toBeVisible();
  await ide.getByRole("button", { name: "Expand output" }).click();
  await ide.getByRole("button", { name: "Collapse output" }).click();
  await expect(
    ide.getByRole("button", { name: "Expand output" }),
  ).toBeVisible();
  await expect(ide.getByTestId("check-result")).toHaveCount(0);

  await ide.getByRole("button", { name: "Validate" }).click();
  await expect(
    ide.getByRole("button", { name: "Collapse output" }),
  ).toBeVisible();
  await expect(ide.getByTestId("check-result")).toBeVisible();

  const helpLink = ide.getByRole("link", { name: /Guide/ });
  await expect(helpLink).toHaveAttribute("href", "../guide/");
  await expect(ide.locator(".brand")).toHaveAttribute("aria-label", "UCSBXRP");
  await expect(ide.locator(".brand")).toHaveText("UCSBXRP");
  const [narrowHeaderBox, narrowToolbarBox, narrowTargetBox] =
    await Promise.all([
      ide.locator(".app-header").boundingBox(),
      ide.locator(".toolbar").boundingBox(),
      ide.getByLabel("Run on").boundingBox(),
    ]);
  expect(narrowToolbarBox?.height).toBeLessThanOrEqual(
    narrowHeaderBox?.height ?? 29,
  );
  expect(narrowTargetBox?.y).toBeGreaterThanOrEqual(narrowHeaderBox?.y ?? 0);
  expect(
    (narrowTargetBox?.y ?? 0) + (narrowTargetBox?.height ?? 0),
  ).toBeLessThanOrEqual(
    (narrowHeaderBox?.y ?? 0) + (narrowHeaderBox?.height ?? 29),
  );
  await expect(
    ide.getByRole("button", { name: "Settings", exact: true }),
  ).toBeVisible();
  await ide.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(ide.getByTestId("settings-panel")).toBeVisible();
  const [openHeaderBox, settingsBox] = await Promise.all([
    ide.locator(".app-header").boundingBox(),
    ide.getByTestId("settings-panel").boundingBox(),
  ]);
  expect(settingsBox?.y).toBeGreaterThanOrEqual(
    (openHeaderBox?.y ?? 0) + (openHeaderBox?.height ?? 0) - 1,
  );
  expect(
    await ide.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await ide.getByRole("button", { name: "Close settings" }).click();
  const monitorLink = ide.getByRole("link", { name: "Monitor", exact: true });
  await expect(monitorLink).toHaveAttribute("href", "../monitor/");
  expect(browserErrors).toEqual([]);
});

test("collapses an open project drawer when the IDE becomes narrow", async ({
  page: ide,
}) => {
  await ide.setViewportSize({ width: 1200, height: 800 });
  await ide.goto("/ide/");
  await expect(
    ide.getByRole("complementary", { name: "Project" }),
  ).toBeVisible();

  await ide.setViewportSize({ width: 375, height: 800 });
  await expect(ide.getByRole("button", { name: "Project ›" })).toBeVisible();
  await expect(ide.getByRole("complementary", { name: "Project" })).toHaveCount(
    0,
  );
});
