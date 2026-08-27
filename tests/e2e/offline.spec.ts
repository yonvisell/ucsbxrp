import { expect, test, type Page } from "@playwright/test";

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
      message: "the complete production precache should finish",
    })
    .toBe("ready");
  await expect(page.locator("html")).toHaveAttribute(
    "data-offline-shell-version",
    /^[a-f0-9]{20}$/,
  );
}

test("reloads the complete production course shell without a network", async ({
  context,
  page: ide,
}) => {
  const browserErrors: string[] = [];
  const externalRequests: string[] = [];
  const recordErrors = (page: Page) => {
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") {
        browserErrors.push(message.text());
      }
    });
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.protocol === "http:" || url.protocol === "https:") {
        if (url.hostname !== "127.0.0.1") {
          externalRequests.push(request.url());
        }
      }
    });
  };
  recordErrors(ide);

  await ide.goto(coursePath("ide/"));
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await ide.getByLabel("Project template").selectOption("challenge_1");
  await ide
    .getByRole("button", { name: "Create new project…", exact: true })
    .click();
  await ide.getByRole("button", { name: "Continue without a folder" }).click();
  expect(
    await ide
      .getByRole("link", { name: /Guide/ })
      .evaluate((link) => (link as HTMLAnchorElement).href),
  ).toBe(new URL(coursePath("guide/"), ide.url()).toString());
  await expectOfflineShellReady(ide);
  await expect(ide.getByTestId("offline-readiness")).toHaveCount(0);
  await ide.getByRole("button", { name: "Settings" }).click();
  await expect(ide.getByTestId("offline-readiness")).toContainText(
    "Course apps available offline",
  );
  await expect(ide.getByTestId("offline-readiness")).toHaveAttribute(
    "title",
    /saved a local copy of IDE and the other UCSBXRP course apps.*Reopen them from this browser profile without internet.*Project files are separate and stay in the selected Projects folder.*project changes remain in this browser only/s,
  );
  await expect(
    ide.locator(".app-header").getByTestId("offline-readiness"),
  ).toHaveCount(0);
  const ideOfflineBox = await ide
    .getByTestId("settings-panel")
    .getByTestId("offline-readiness")
    .boundingBox();
  const settingsBox = await ide.getByTestId("settings-panel").boundingBox();
  expect(ideOfflineBox?.x).toBeGreaterThanOrEqual(settingsBox?.x ?? 0);
  expect(
    (ideOfflineBox?.x ?? 0) + (ideOfflineBox?.width ?? 0),
  ).toBeLessThanOrEqual((settingsBox?.x ?? 0) + (settingsBox?.width ?? 0));
  expect(ideOfflineBox?.y).toBeGreaterThan(settingsBox?.y ?? 0);
  await expect(ide.locator(".ide-offline-status")).toHaveCount(0);

  const manifest = await ide.evaluate(async (manifestPath) => {
    const response = await fetch(manifestPath);
    return (await response.json()) as {
      assets: Array<{ path: string }>;
      base_path: string;
      cache_name: string;
    };
  }, coursePath("offline-manifest.json"));
  expect(manifest.base_path).toBe(deploymentBase);
  expect(manifest.assets.some((asset) => asset.path.endsWith(".wasm"))).toBe(
    true,
  );
  expect(
    manifest.assets.some((asset) =>
      asset.path.startsWith("assets/micropython.worker-"),
    ),
  ).toBe(true);
  expect(
    manifest.assets.some((asset) =>
      asset.path.startsWith("assets/virtual-target.shared-worker-"),
    ),
  ).toBe(true);

  await context.setOffline(true);

  await ide.reload({ waitUntil: "domcontentloaded" });
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expectOfflineShellReady(ide);
  await expect(ide.getByTestId("offline-readiness")).toHaveCount(0);
  await ide.getByRole("button", { name: "Settings" }).click();
  await expect(ide.getByTestId("offline-readiness")).toContainText(
    "Course apps available offline",
  );

  await ide.getByRole("button", { name: "Validate" }).click();
  await expect(ide.getByTestId("check-result")).toContainText(
    "compiled with MicroPython",
  );

  const monitor = await context.newPage();
  recordErrors(monitor);
  await monitor.goto(coursePath("monitor/"), {
    waitUntil: "domcontentloaded",
  });
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expectOfflineShellReady(monitor);
  await expect(monitor.getByTestId("offline-readiness")).toContainText(
    "Course apps available offline",
  );
  await expect(monitor.locator(".monitor-controls-footer")).toHaveCount(0);

  await ide.getByRole("button", { name: "Run", exact: true }).click();
  await expect(ide.getByRole("log")).toContainText("Challenge 1 complete", {
    timeout: 20_000,
  });
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(monitor.getByTestId("motor-effort")).toHaveText("0.00 / 0.00");

  const guide = await context.newPage();
  recordErrors(guide);
  await guide.goto(coursePath("guide/"), { waitUntil: "domcontentloaded" });
  await expect(
    guide.getByRole("heading", {
      name: "Connect a physical XRP",
    }),
  ).toBeVisible();
  await expect(
    guide.getByRole("heading", { name: "Challenges" }),
  ).toBeVisible();
  await expect(
    guide.getByRole("heading", {
      name: "Using UCSBXRP without internet",
    }),
  ).toBeVisible();
  await expectOfflineShellReady(guide);

  const reference = await context.newPage();
  recordErrors(reference);
  await reference.goto(coursePath("reference/"), {
    waitUntil: "domcontentloaded",
  });
  await expect(
    reference.getByRole("heading", {
      name: "API reference",
      exact: true,
    }),
  ).toBeVisible();
  await expect(reference.locator("#sensor-model")).toContainText(
    "State between calls",
  );
  await expect(reference.locator("#sensor-model")).toContainText("Behavior");
  await expectOfflineShellReady(reference);

  const author = await context.newPage();
  recordErrors(author);
  await author.goto(coursePath("author/"), {
    waitUntil: "domcontentloaded",
  });
  await expect(
    author.getByRole("heading", {
      name: "UCSBXRP challenge specification editor",
    }),
  ).toBeVisible();
  await expect(author.getByText("Specification checks pass.")).toBeVisible();
  await expectOfflineShellReady(author);

  const overview = await context.newPage();
  recordErrors(overview);
  await overview.goto(coursePath("overview/"), {
    waitUntil: "domcontentloaded",
  });
  await expect(
    overview.getByRole("heading", {
      name: "UCSBXRP instructor system reference",
    }),
  ).toBeVisible();
  await expect(
    overview.getByRole("heading", { name: "Runtime architecture" }),
  ).toBeVisible();
  await expectOfflineShellReady(overview);

  const landing = await context.newPage();
  recordErrors(landing);
  await landing.goto(coursePath(), { waitUntil: "domcontentloaded" });
  await expect(
    landing.getByRole("heading", {
      name: "Program, Simulate, and Run Live Telemetry for the XRP robot",
    }),
  ).toBeVisible();
  expect(
    await landing
      .getByRole("link", { name: "Open IDE" })
      .evaluate((link) => (link as HTMLAnchorElement).href),
  ).toBe(new URL(coursePath("ide/"), landing.url()).toString());
  expect(
    await landing
      .getByRole("link", { name: "UCSB XRP API" })
      .evaluate((link) => (link as HTMLAnchorElement).href),
  ).toBe(new URL(coursePath("reference/"), landing.url()).toString());
  await expectOfflineShellReady(landing);

  const installButton = landing.getByTestId("install-course-tools");
  await expect(installButton).toBeHidden();
  await landing.evaluate(() => {
    const testWindow = window as typeof window & {
      __installPromptCalls?: number;
    };
    testWindow.__installPromptCalls = 0;
    const promptEvent = new Event("beforeinstallprompt", {
      cancelable: true,
    });
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
    await landing.evaluate(
      () =>
        (window as typeof window & { __installPromptCalls?: number })
          .__installPromptCalls,
    ),
  ).toBe(1);

  const webAppManifest = await landing.evaluate(async (manifestPath) => {
    const response = await fetch(manifestPath);
    return (await response.json()) as {
      display: string;
      icons: Array<{ sizes: string; src: string }>;
      name: string;
      scope: string;
      start_url: string;
    };
  }, coursePath("manifest.webmanifest"));
  expect(webAppManifest).toMatchObject({
    display: "standalone",
    name: "UCSBXRP Course Tools",
    scope: "./",
    start_url: "./ide/",
  });
  expect(webAppManifest.icons.map((icon) => icon.sizes)).toEqual([
    "192x192",
    "512x512",
  ]);

  expect(browserErrors).toEqual([]);
  expect(externalRequests).toEqual([]);
});
