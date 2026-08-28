import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const requestedBasePath = process.env.COURSE_BASE_PATH?.trim() ?? "/";
const deploymentBase =
  requestedBasePath === "/"
    ? "/"
    : `/${requestedBasePath.replace(/^\/+|\/+$/g, "")}/`;

function coursePath(path = "") {
  return `${deploymentBase}${path}`;
}

async function expectOfflineShellReady(page: Page) {
  await expect
    .poll(() => page.locator("html").getAttribute("data-offline-shell-state"), {
      message: "the production course apps should finish saving in Chrome",
    })
    .toBe("ready");
  await expect(page.locator("html")).toHaveAttribute(
    "data-offline-shell-version",
    /^[a-f0-9]{20}$/,
  );
}

async function provideEmptyWorkingFolder(
  page: Page,
  folderName: string,
): Promise<void> {
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

  await page.goto(coursePath());
  await page.evaluate(async (selectedFolderName) => {
    const root = await navigator.storage.getDirectory();
    try {
      await root.removeEntry(selectedFolderName, { recursive: true });
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== "NotFoundError") {
        throw error;
      }
    }
  }, folderName);
}

function recordBrowserProblems(context: BrowserContext) {
  const errors: string[] = [];
  const externalRequests: string[] = [];
  const attach = (page: Page) => {
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (
        (url.protocol === "http:" || url.protocol === "https:") &&
        url.hostname !== "127.0.0.1"
      ) {
        externalRequests.push(request.url());
      }
    });
  };
  context.on("page", attach);
  for (const page of context.pages()) attach(page);
  return { errors, externalRequests };
}

test("creates a folder-backed project and reopens the course apps without internet", async ({
  context,
  page: ide,
}) => {
  const problems = recordBrowserProblems(context);
  await provideEmptyWorkingFolder(ide, "Offline-First-Use");

  await ide.goto(coursePath("ide/"));
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await ide.getByRole("button", { name: "New project…", exact: true }).click();
  await ide.getByLabel("Project template").selectOption("demo_spiral");
  await ide.getByLabel("Name").fill("Offline-Spiral");
  await ide
    .getByRole("button", { name: "Choose Working folder and create" })
    .click();
  await expect(ide.getByTestId("project-name")).toHaveText("Expanding spiral");
  await expect(ide.getByTestId("project-folder")).toHaveText("Offline-Spiral");
  await expect(ide.getByTestId("project-save-state")).toHaveText("Saved");
  await expectOfflineShellReady(ide);

  await context.setOffline(true);
  await ide.reload({ waitUntil: "domcontentloaded" });
  await expect(ide.getByTestId("project-name")).toHaveText("Expanding spiral");
  await expect(ide.getByTestId("project-save-state")).toHaveText("Saved");
  await expectOfflineShellReady(ide);

  await ide.getByRole("button", { name: "Compile" }).click();
  await expect(ide.getByTestId("check-result")).toContainText(
    "compiled with MicroPython",
  );
  await ide.getByRole("button", { name: "Run", exact: true }).click();
  await expect(
    ide.getByRole("button", { name: "Stop", exact: true }),
  ).toBeVisible();
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · running",
  );
  await ide.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  const monitor = await context.newPage();
  await monitor.goto(coursePath("monitor/"), { waitUntil: "domcontentloaded" });
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(
    monitor.getByRole("button", { name: "Run", exact: true }),
  ).toHaveAttribute("title", /Expanding spiral/);
  await expectOfflineShellReady(monitor);

  const guide = await context.newPage();
  await guide.goto(coursePath("guide/"), { waitUntil: "domcontentloaded" });
  await expect(
    guide.getByRole("heading", { name: "Physical XRP setup and networks" }),
  ).toBeVisible();
  await expectOfflineShellReady(guide);

  const reference = await context.newPage();
  await reference.goto(coursePath("reference/"), {
    waitUntil: "domcontentloaded",
  });
  await expect(
    reference.getByRole("heading", {
      name: "UCSB XRP API reference",
      exact: true,
    }),
  ).toBeVisible();
  await expectOfflineShellReady(reference);

  expect(problems.errors).toEqual([]);
  expect(problems.externalRequests).toEqual([]);
});

test("offers the installed-app launcher when Chrome makes installation available", async ({
  page,
}) => {
  await page.goto(coursePath());
  await expect(
    page.getByRole("heading", {
      name: "Program, Simulate, and Run Live Telemetry for the XRP robot",
    }),
  ).toBeVisible();
  await expectOfflineShellReady(page);

  const installButton = page.getByTestId("install-course-tools");
  await expect(installButton).toBeHidden();
  await page.evaluate(() => {
    const testWindow = window as typeof window & {
      __installPromptCalls?: number;
    };
    testWindow.__installPromptCalls = 0;
    const promptEvent = new Event("beforeinstallprompt", { cancelable: true });
    Object.defineProperties(promptEvent, {
      prompt: {
        value: () => {
          testWindow.__installPromptCalls =
            (testWindow.__installPromptCalls ?? 0) + 1;
        },
      },
      userChoice: {
        value: Promise.resolve({ outcome: "accepted", platform: "web" }),
      },
    });
    window.dispatchEvent(promptEvent);
  });
  await expect(installButton).toBeVisible();
  await expect(installButton).toHaveText(
    "Install UCSBXRP app — strongly recommended",
  );
  await installButton.click();
  await expect(installButton).toBeHidden();
  expect(
    await page.evaluate(
      () =>
        (window as typeof window & { __installPromptCalls?: number })
          .__installPromptCalls,
    ),
  ).toBe(1);
});
