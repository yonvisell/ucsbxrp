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
  await ide.getByRole("button", { name: "Load", exact: true }).click();
  expect(
    await ide
      .getByRole("link", { name: /Guide/ })
      .evaluate((link) => (link as HTMLAnchorElement).href),
  ).toBe(new URL(coursePath("guide/"), ide.url()).toString());
  await expectOfflineShellReady(ide);
  await expect(ide.getByTestId("offline-readiness")).toContainText(
    "Saved for offline use",
  );
  await expect(
    ide.locator(".app-header").getByTestId("offline-readiness"),
  ).toHaveCount(0);
  const ideOfflineBox = await ide
    .locator(".ide-offline-status")
    .getByTestId("offline-readiness")
    .boundingBox();
  const projectRailBox = await ide.locator(".project-rail").boundingBox();
  expect(ideOfflineBox?.x).toBeGreaterThanOrEqual(projectRailBox?.x ?? 0);
  expect(
    (ideOfflineBox?.x ?? 0) + (ideOfflineBox?.width ?? 0),
  ).toBeLessThanOrEqual(
    (projectRailBox?.x ?? 0) + (projectRailBox?.width ?? 0),
  );
  expect(ideOfflineBox?.y).toBeGreaterThan(
    (projectRailBox?.y ?? 0) + (projectRailBox?.height ?? 0) * 0.8,
  );

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
  await expect(ide.getByTestId("offline-readiness")).toContainText(
    "Saved for offline use",
  );

  await ide.getByRole("button", { name: "Validate code" }).click();
  await expect(ide.getByTestId("check-result")).toContainText(
    "compiled with MicroPython",
  );

  const monitor = await context.newPage();
  recordErrors(monitor);
  await monitor.goto(coursePath("dashboard/"), {
    waitUntil: "domcontentloaded",
  });
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expectOfflineShellReady(monitor);
  await expect(monitor.getByTestId("offline-readiness")).toContainText(
    "Saved for offline use",
  );

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
      name: "Use a physical RP2350 XRP",
    }),
  ).toBeVisible();
  await expectOfflineShellReady(guide);

  const landing = await context.newPage();
  recordErrors(landing);
  await landing.goto(coursePath(), { waitUntil: "domcontentloaded" });
  await expect(
    landing.getByRole("heading", { name: "Build the program. See the robot." }),
  ).toBeVisible();
  expect(
    await landing
      .getByRole("link", { name: "Open IDE" })
      .evaluate((link) => (link as HTMLAnchorElement).href),
  ).toBe(new URL(coursePath("ide/"), landing.url()).toString());
  await expectOfflineShellReady(landing);

  expect(browserErrors).toEqual([]);
  expect(externalRequests).toEqual([]);
});
