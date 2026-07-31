import { expect, test } from "@playwright/test";

function numericValue(text: string | null): number {
  return Number.parseFloat(text ?? "NaN");
}

test("edits a multi-file project and completes the virtual XRP workflow", async ({
  context,
  page: ide,
}) => {
  const browserErrors: string[] = [];
  const recordErrors = (page: typeof ide) => {
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") {
        browserErrors.push(message.text());
      }
    });
  };
  recordErrors(ide);

  await ide.addInitScript(() => {
    const savedFiles: Record<string, string> = {};

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

      async getDirectoryHandle(name: string) {
        return new FakeDirectoryHandle(name, `${this.prefix}${name}/`);
      }

      async getFileHandle(name: string) {
        return new FakeFileHandle(name, `${this.prefix}${name}`);
      }
    }

    Object.defineProperty(window, "__savedCourseFiles", {
      value: savedFiles,
    });
    Object.defineProperty(window, "showDirectoryPicker", {
      value: async () => new FakeDirectoryHandle("browser-course-project"),
    });
  });

  await ide.goto("/ide/");
  const dashboard = await context.newPage();
  recordErrors(dashboard);
  await dashboard.goto("/dashboard/");

  const ideStatus = ide.getByTestId("target-status");
  const dashboardStatus = dashboard.getByTestId("target-status");
  await expect(ideStatus).toContainText("Virtual XRP · ready");
  await expect(dashboardStatus).toContainText("Virtual XRP · ready");
  await expect(dashboard.getByRole("log")).toContainText("No run yet");

  await ide.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(ide.getByTestId("settings-panel")).toBeVisible();
  await expect(ide.getByLabel(/Editor font size/)).toHaveValue("11");
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
  await ide
    .getByRole("button", { name: /main\.py/ })
    .first()
    .click();

  await ide.getByRole("button", { name: "Validate code" }).click();
  await expect(ide.getByTestId("check-result")).toContainText(
    "2 Python files compiled with MicroPython",
  );

  await ide.getByRole("button", { name: "Run virtual XRP" }).click();
  await expect(ideStatus).toContainText("Virtual XRP · running");
  await expect(dashboardStatus).toContainText("Virtual XRP · running");
  await expect
    .poll(
      async () =>
        numericValue(await dashboard.getByTestId("x-mm").textContent()),
      { message: "virtual XRP should translate after motor effort is applied" },
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

  await ide.getByRole("button", { name: "Run virtual XRP" }).click();
  await expect(dashboardStatus).toContainText("Virtual XRP · running");
  await dashboard.getByRole("button", { name: "Stop program" }).click();
  await expect(ide.getByRole("log")).toContainText(
    "Run stopped; motor effort set to zero",
  );
  await expect(ideStatus).toContainText("Virtual XRP · ready");

  await dashboard.getByRole("button", { name: "Reset virtual XRP" }).click();
  await expect(dashboard.getByTestId("x-mm")).toHaveText("0.0 mm");
  await expect(dashboard.getByTestId("motor-effort")).toHaveText("0.00 / 0.00");

  await ide.getByRole("button", { name: "Save files" }).click();
  await ide.getByRole("tab", { name: "Status" }).click();
  await expect(
    ide.getByText("Saved all project files to browser-course-project."),
  ).toBeVisible();
  const savedController = await ide.evaluate(
    () =>
      (
        window as unknown as {
          __savedCourseFiles: Record<string, string>;
        }
      ).__savedCourseFiles["student/straight_line_controller.py"],
  );
  expect(savedController).toBe("");
  await ide.getByRole("button", { name: "Open folder" }).click();
  await expect(
    ide.getByText("Opened browser-course-project: 2 supported files."),
  ).toBeVisible();

  const guide = await context.newPage();
  recordErrors(guide);
  await guide.goto("/guide/");
  await expect(
    guide.getByRole("heading", {
      name: "Verified RP2350 state and safe next steps",
    }),
  ).toBeVisible();
  await expect(guide.getByText("MotorEfforts(left, right)")).toBeVisible();

  expect(browserErrors).toEqual([]);
});

test("abandons a virtual run safely when its IDE owner disappears", async ({
  context,
  page: ide,
}) => {
  await ide.addInitScript(() => {
    localStorage.setItem(
      "ucsb-xrp-course-project-v1",
      JSON.stringify({
        name: "owner-lease-proof",
        entrypoint: "main.py",
        files: {
          "main.py": `from time import sleep_ms
from ucsb_xrp import MotorEfforts, RobotConfig, XRPBot

bot = XRPBot(RobotConfig(max_effort=0.65))
bot.set_efforts(MotorEfforts(0.6, 0.6))
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
  await monitor.goto("/dashboard/");

  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await ide.getByRole("button", { name: "Validate code" }).click();
  await expect(ide.getByTestId("check-result")).toContainText(
    "1 Python file compiled with MicroPython",
  );

  await ide.getByRole("button", { name: "Run virtual XRP" }).click();
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
  await expect(monitor.getByRole("log")).toContainText(
    "motor effort set to zero",
  );
});

test("keeps project and output controls usable on a narrow screen", async ({
  page: ide,
}) => {
  await ide.setViewportSize({ width: 375, height: 800 });
  await ide.goto("/ide/");
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  const showProjectFiles = ide.getByRole("button", {
    name: /Project files/,
  });
  await expect(showProjectFiles).toBeVisible();
  await showProjectFiles.click();
  await expect(
    ide.getByRole("complementary", { name: "Project files" }),
  ).toBeVisible();
  await ide.getByRole("button", { name: "Collapse project files" }).click();
  await expect(showProjectFiles).toBeVisible();

  await ide.getByRole("button", { name: "Collapse output" }).click();
  await expect(
    ide.getByRole("button", { name: "Expand output" }),
  ).toBeVisible();
  await expect(ide.getByTestId("check-result")).toHaveCount(0);

  await ide.getByRole("button", { name: "Validate code" }).click();
  await expect(
    ide.getByRole("button", { name: "Collapse output" }),
  ).toBeVisible();
  await expect(ide.getByTestId("check-result")).toBeVisible();

  const helpLink = ide.getByRole("link", { name: /Help & robot setup/ });
  await expect(helpLink).toHaveAttribute("rel", "noopener noreferrer");
});
