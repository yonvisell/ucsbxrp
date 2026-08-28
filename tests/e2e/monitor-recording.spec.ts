import { expect, test, type Page } from "@playwright/test";

import {
  readWorkspaceExports,
  readWorkspaceTextFile,
  seedWorkingFolder,
} from "./working-folder";

const monitorWorkspace = "Monitor-Recording";

test.beforeEach(async ({ page }) => {
  await seedWorkingFolder(page, { folderName: monitorWorkspace });
});

function recordedCount(text: string | null): number {
  const match = (text ?? "").match(/([\d,]+) samples/);
  return Number.parseInt((match?.[1] ?? "0").replaceAll(",", ""), 10);
}

async function visiblePlotHeights(page: Page): Promise<Record<string, number>> {
  return page
    .locator(".strip-chart-stack")
    .evaluate((stack) =>
      Object.fromEntries(
        [...stack.querySelectorAll<HTMLElement>(".strip-chart")].map((plot) => [
          plot.querySelector<HTMLElement>("[data-testid]")?.dataset.testid ??
            "unknown",
          plot.getBoundingClientRect().height,
        ]),
      ),
    );
}

test("keeps one completed run ready for notes and every export", async ({
  context,
  page: ide,
}) => {
  test.setTimeout(60_000);
  await context.addInitScript(() => {
    Object.defineProperty(window, "showSaveFilePicker", {
      configurable: true,
      value: undefined,
    });
  });
  await ide.goto("/ide/");
  const monitor = await context.newPage();
  await monitor.goto("/monitor/");

  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(monitor.getByTestId("x-mm")).toBeVisible();

  await monitor
    .locator(".app-header")
    .getByRole("button", { name: "Run", exact: true })
    .click();

  await expect
    .poll(
      async () =>
        recordedCount(
          await monitor.getByTestId("recording-count").textContent(),
        ),
      { message: "the run dataset should receive the target's samples" },
    )
    .toBeGreaterThan(3);
  await expect(monitor.getByTestId("telemetry-rate")).toContainText("Hz");

  await monitor
    .getByTestId("wheel-speed-plot")
    .click({ button: "right", position: { x: 160, y: 60 } });
  await monitor.getByLabel("Note label").fill("turn begins");
  await monitor.getByRole("button", { name: "Add", exact: true }).click();
  await expect(
    monitor.getByRole("button", { name: "Hide notes · 1" }),
  ).toBeVisible();

  const stop = monitor
    .locator(".app-header")
    .getByRole("button", { name: "Stop", exact: true });
  if (await stop.isVisible()) await stop.click();
  await expect(monitor.getByTestId("recording-count")).toContainText(
    "Expanding spiral ·",
  );
  await expect(
    monitor.getByRole("button", { name: "Export plots as SVG" }),
  ).toBeEnabled();

  await expect
    .poll(
      async () =>
        readWorkspaceTextFile(
          monitor,
          "UCSBXRP_diagnostic.log",
          monitorWorkspace,
        ).catch(() => ""),
      { message: "Monitor should append its completed-run summary" },
    )
    .toContain('event="run.finished"');
  const diagnosticLog = await readWorkspaceTextFile(
    monitor,
    "UCSBXRP_diagnostic.log",
    monitorWorkspace,
  );
  expect(diagnosticLog).toContain('app="Monitor"');
  expect(diagnosticLog).toContain('event="run.started"');
  expect(diagnosticLog).not.toContain('event="telemetry.sample"');
  expect(diagnosticLog).not.toContain('"leftEffort"');

  await monitor.getByRole("button", { name: "Export run data as CSV" }).click();
  await expect(
    monitor.getByText(/Saved .*xrp-telemetry-.*\.csv$/),
  ).toBeVisible();
  const csvFile = (
    await readWorkspaceExports(monitor, { folderName: monitorWorkspace })
  ).find((file) => file.name.endsWith(".csv"));
  expect(csvFile?.name).toMatch(/^xrp-telemetry-\d{4}-\d{2}-\d{2}T.*\.csv$/);
  const csv = csvFile?.text ?? "";
  const rows = csv.trimEnd().split("\n");
  const columns = rows[0]!.split(",");
  expect(columns).toEqual(
    expect.arrayContaining([
      "left_wheel_distance_mm",
      "right_wheel_distance_mm",
      "program_spiral_travel_mm",
      "program_spiral_turn_rate_rad_s",
    ]),
  );
  expect(rows.length).toBeGreaterThan(4);
  expect(rows[1]?.split(",")).toHaveLength(columns.length);
  expect(columns.at(-1)).toBe("note");
  expect(csv).toContain("turn begins");

  await monitor.getByRole("button", { name: "Export plots as SVG" }).click();
  await expect(monitor.getByText(/Saved .*xrp-plots-.*\.svg$/)).toBeVisible();
  const svgFile = (
    await readWorkspaceExports(monitor, { folderName: monitorWorkspace })
  ).find((file) => file.name.endsWith(".svg"));
  expect(svgFile?.name).toMatch(/^xrp-plots-.*\.svg$/);
  const svg = svgFile?.text ?? "";
  expect(svg).toContain("UCSBXRP signal plots");
  expect(svg).toContain("turn begins");

  await monitor.getByRole("button", { name: "Export plots as PNG" }).click();
  await expect(monitor.getByText(/Saved .*xrp-plots-.*\.png$/)).toBeVisible();
  const pngFile = (
    await readWorkspaceExports(monitor, { folderName: monitorWorkspace })
  ).find((file) => file.name.endsWith(".png"));
  expect(pngFile?.name).toMatch(/^xrp-plots-.*\.png$/);
  expect(pngFile?.byteLength ?? 0).toBeGreaterThan(2_000);

  await monitor
    .getByRole("button", { name: "Export world animation as WebM" })
    .click();
  await expect(
    monitor.getByText(/Saved .*xrp-world-animation-.*\.webm$/),
  ).toBeVisible({ timeout: 20_000 });
  const webmFile = (
    await readWorkspaceExports(monitor, { folderName: monitorWorkspace })
  ).find((file) => file.name.endsWith(".webm"));
  expect(webmFile?.name).toMatch(/^xrp-world-animation-.*\.webm$/);
  expect(webmFile?.byteLength ?? 0).toBeGreaterThan(1_000);

  await monitor
    .locator(".monitor-controls")
    .getByRole("button", { name: "Clear run", exact: true })
    .click();
  await expect(monitor.getByTestId("recording-count")).toContainText(
    "Run a program to collect data.",
  );
  await expect(
    monitor.getByRole("button", { name: "Export run data as CSV" }),
  ).toBeDisabled();
});

test("directs a restarted browser to reconnect folder access without an unhandled error", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(
      FileSystemDirectoryHandle.prototype,
      "queryPermission",
      {
        configurable: true,
        value: async () => "prompt",
      },
    );
  });

  await page.goto("/monitor/");

  await expect(
    page.getByText(/Reconnect (?:Working|project) folder/i),
  ).toBeVisible();
  await expect(
    page.locator(".app-header").getByRole("button", {
      name: "Run",
      exact: true,
    }),
  ).toBeDisabled();
  expect(pageErrors).toEqual([]);
});

test("records and labels a run started from the IDE", async ({
  context,
  page: ide,
}) => {
  test.setTimeout(45_000);
  await ide.goto("/ide/");
  const monitor = await context.newPage();
  await monitor.goto("/monitor/");
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  // Leave one completed dataset in Monitor, then start a different Project
  // from IDE. The new target Run event must replace the previous dataset.
  await monitor
    .locator(".app-header")
    .getByRole("button", { name: "Run", exact: true })
    .click();
  await expect
    .poll(async () =>
      recordedCount(await monitor.getByTestId("recording-count").textContent()),
    )
    .toBeGreaterThan(3);
  await monitor
    .locator(".app-header")
    .getByRole("button", { name: "Stop", exact: true })
    .click();
  await expect(monitor.getByTestId("recording-count")).toContainText(
    "Expanding spiral ·",
  );

  await ide.getByRole("button", { name: "New project…" }).click();
  await ide.getByLabel("Project template").selectOption("challenge_1");
  await ide.getByRole("button", { name: "Create", exact: true }).click();
  await expect(monitor.getByTestId("target-status")).toContainText(
    "1 · Straight Run",
  );

  await ide.getByRole("button", { name: "Run", exact: true }).click();
  await expect(monitor.getByTestId("target-status")).toContainText("running", {
    timeout: 15_000,
  });
  await expect
    .poll(async () =>
      recordedCount(await monitor.getByTestId("recording-count").textContent()),
    )
    .toBeGreaterThan(2);
  await monitor
    .locator(".app-header")
    .getByRole("button", { name: "Stop", exact: true })
    .click();
  await expect(monitor.getByTestId("recording-count")).toContainText(
    "1 · Straight Run ·",
  );
});

test("clears an old note when the telemetry sequence restarts", async ({
  context,
  page: ide,
}) => {
  await ide.goto("/ide/");
  const monitor = await context.newPage();
  await monitor.goto("/monitor/");
  await expect(monitor.getByTestId("wheel-speed-plot")).toBeVisible();

  await monitor
    .locator(".app-header")
    .getByRole("button", { name: "Run", exact: true })
    .click();
  await expect
    .poll(async () =>
      Number.parseInt(
        (await monitor
          .locator(".signal-plot-shell")
          .first()
          .getAttribute("data-sample-count")) ?? "0",
        10,
      ),
    )
    .toBeGreaterThan(2);
  const stop = monitor
    .locator(".app-header")
    .getByRole("button", { name: "Stop", exact: true });
  if (await stop.isVisible()) await stop.click();
  await expect(ide.getByTestId("target-status")).toContainText("ready");

  await monitor
    .getByTestId("wheel-speed-plot")
    .click({ button: "right", position: { x: 160, y: 60 } });
  await monitor.getByLabel("Note label").fill("before run");
  await monitor.getByRole("button", { name: "Add", exact: true }).click();
  await expect(
    monitor.getByRole("button", { name: "Hide notes · 1" }),
  ).toBeVisible();

  await monitor
    .locator(".app-header")
    .getByRole("button", { name: "Run", exact: true })
    .click();
  await expect(monitor.getByTestId("target-status")).toContainText("running", {
    timeout: 20_000,
  });
  await expect(
    monitor.getByRole("button", { name: "Hide notes · 1" }),
  ).toHaveCount(0);
});

test("collects a run automatically and explains animation availability", async ({
  page,
}) => {
  await page.goto("/monitor/");

  const animation = page.getByRole("button", {
    name: "Export world animation as WebM",
  });
  await expect(animation).toBeDisabled();
  await expect(
    page.getByText(/Run a program to create an animation/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Start recording/ }),
  ).toHaveCount(0);

  await page
    .locator(".app-header")
    .getByRole("button", { name: "Run", exact: true })
    .click();
  await expect
    .poll(async () =>
      recordedCount(await page.getByTestId("recording-count").textContent()),
    )
    .toBeGreaterThan(3);
  await expect(
    page.getByText(/Wait for the current run to finish/),
  ).toBeVisible();
  await page
    .locator(".app-header")
    .getByRole("button", { name: "Stop", exact: true })
    .click();
  await expect(page.getByTestId("recording-count")).toContainText(
    "Expanding spiral ·",
  );
  await expect(animation).toBeEnabled();
});

test("reset and rerun begin a new world path without a connector", async ({
  page,
}) => {
  await page.goto("/monitor/");
  await page
    .locator(".app-header")
    .getByRole("button", { name: "Run", exact: true })
    .click();
  await expect
    .poll(async () =>
      recordedCount(await page.getByTestId("recording-count").textContent()),
    )
    .toBeGreaterThan(3);
  await page
    .locator(".app-header")
    .getByRole("button", { name: "Stop", exact: true })
    .click();
  await expect(page.getByTestId("recording-count")).toContainText(
    "Expanding spiral ·",
  );
  await page
    .locator(".app-header")
    .getByRole("button", { name: "Reset", exact: true })
    .click();
  await page
    .locator(".app-header")
    .getByRole("button", { name: "Run", exact: true })
    .click();
  await expect
    .poll(async () =>
      Number(
        await page
          .getByTestId("world-view")
          .getAttribute("data-path-segment-count"),
      ),
    )
    .toBeGreaterThan(0);
  const path = await page.getByTestId("world-view").evaluate((element) => ({
    points: Number((element as HTMLElement).dataset.pathPointCount),
    segments: Number((element as HTMLElement).dataset.pathSegmentCount),
    maximumSegmentMm: Number(
      (element as HTMLElement).dataset.pathMaximumSegmentMm,
    ),
  }));
  expect(path.segments).toBeGreaterThan(0);
  expect(path.segments).toBeLessThan(path.points);
  expect(path.maximumSegmentMm).toBeLessThan(50);
});

test("selects plotted signals from the Monitor controls", async ({
  context,
  page,
}) => {
  const ide = await context.newPage();
  await ide.goto("/ide/");
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await page.goto("/monitor/");
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(page.locator(".monitor-run-button")).toBeEnabled();

  const brand = page.locator(".brand");
  await expect(brand).toHaveAttribute("aria-label", "UCSBXRP");
  await expect(brand).toHaveText("UCSBXRP");
  const brandStyle = await brand.evaluate((element) => {
    const mark = element.children[0] as HTMLElement;
    const name = element.children[1] as HTMLElement;
    const markStyle = getComputedStyle(mark);
    const nameStyle = getComputedStyle(name);
    const markBox = mark.getBoundingClientRect();
    const nameBox = name.getBoundingClientRect();
    return {
      gap: nameBox.left - markBox.right,
      markColor: markStyle.color,
      nameColor: nameStyle.color,
      typography: [
        markStyle.fontFamily,
        markStyle.fontSize,
        markStyle.fontWeight,
        nameStyle.fontFamily,
        nameStyle.fontSize,
        nameStyle.fontWeight,
      ],
    };
  });
  expect(Math.abs(brandStyle.gap)).toBeLessThanOrEqual(0.5);
  expect(brandStyle.markColor).toBe("rgb(0, 88, 138)");
  expect(brandStyle.nameColor).toBe("rgb(118, 84, 94)");
  expect(brandStyle.typography.slice(0, 3)).toEqual(
    brandStyle.typography.slice(3),
  );
  const appNavigation = page.locator(".app-navigation");
  await expect(
    appNavigation.getByRole("link", { name: "IDE", exact: true }),
  ).toHaveAttribute("href", "../workspace/?mode=ide");
  await expect(
    appNavigation.getByRole("link", { name: "Monitor", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  const monitorRun = page.locator(".monitor-run-button");
  await expect(monitorRun).toHaveCSS("background-color", "rgb(238, 240, 242)");
  expect(
    await monitorRun.evaluate(
      (button) => button.getBoundingClientRect().height,
    ),
  ).toBe(19);

  await expect(page.getByTestId("monitor-controls")).toBeVisible();
  await expect(
    page.locator(".monitor-controls-cap").getByText("Controls", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByTestId("wheel-speed-plot")).toBeVisible();
  await expect(page.getByTestId("strip-chart-motor-effort")).toBeVisible();
  expect(
    await page
      .getByTestId("wheel-speed-plot")
      .locator("xpath=..")
      .locator(".signal-series-legend i")
      .evaluateAll((lines) =>
        lines.map((line) => getComputedStyle(line).borderTopStyle),
      ),
  ).toEqual(["solid", "dashed", "dotted", "dotted"]);
  expect(await visiblePlotHeights(page)).toEqual({
    "wheel-speed-plot": 180,
    "strip-chart-motor-effort": 180,
  });
  const controlsBox = await page.getByTestId("monitor-controls").boundingBox();
  const dashboardBox = await page.locator(".dashboard-grid").boundingBox();
  const sliderBox = await page
    .getByLabel("Strip chart time window")
    .boundingBox();
  const firstSignalBox = await page
    .getByRole("checkbox", { name: /Wheel speed/ })
    .boundingBox();
  expect(controlsBox?.width).toBeGreaterThan(165);
  expect(controlsBox?.width).toBeLessThan(185);
  expect(dashboardBox?.x).toBeGreaterThanOrEqual(
    (controlsBox?.x ?? 0) + (controlsBox?.width ?? 0) - 1,
  );
  expect(sliderBox?.height).toBeLessThanOrEqual(16);
  expect((sliderBox?.y ?? 0) + (sliderBox?.height ?? 0)).toBeLessThanOrEqual(
    firstSignalBox?.y ?? 0,
  );
  const liveControlsBox = await page
    .locator(".live-controls-panel")
    .boundingBox();
  const telemetryHeadingBox = await page
    .getByRole("heading", { name: "Live telemetry", exact: true })
    .boundingBox();
  expect(liveControlsBox?.y).toBeLessThan(telemetryHeadingBox?.y ?? 0);
  await expect(page.locator("details.live-controls-panel")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Live controls", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".live-controls-panel summary")).toHaveCount(0);

  const worldValuesSeparator = page.getByRole("separator", {
    name: "Resize world and live telemetry",
  });
  await expect(worldValuesSeparator).toHaveAttribute("aria-valuenow", "77");
  await worldValuesSeparator.focus();
  await worldValuesSeparator.press("ArrowLeft");
  await expect(worldValuesSeparator).toHaveAttribute("aria-valuenow", "75");

  await page.getByRole("checkbox", { name: /Ultrasound distance/ }).check();
  await expect(page.getByTestId("strip-chart-range")).toBeVisible();
  expect(await visiblePlotHeights(page)).toEqual({
    "wheel-speed-plot": 180,
    "strip-chart-motor-effort": 180,
    "strip-chart-range": 180,
  });
  await page.getByRole("checkbox", { name: /Drive command/ }).uncheck();
  await expect(page.getByTestId("strip-chart-motor-effort")).toHaveCount(0);
  expect(await visiblePlotHeights(page)).toEqual({
    "wheel-speed-plot": 180,
    "strip-chart-range": 180,
  });

  await page.getByLabel("Strip chart time window").fill("6");
  await expect(page.getByText("6 s", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Collapse monitor controls" }).click();
  await expect(
    page.getByRole("button", { name: "Open monitor controls" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open monitor controls" }).click();
  await expect(
    page.getByRole("heading", { name: "Plot signals", exact: true }),
  ).toBeVisible();
});

test("keeps the Monitor compact and operable at laptop-narrow width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 691, height: 752 });
  await page.goto("/monitor/");
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  const headerBox = await page.locator(".app-header").boundingBox();
  expect(headerBox?.height).toBeLessThanOrEqual(74);
  await expect(
    page
      .locator(".app-navigation")
      .getByRole("link", { name: "Set up or Repair", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open monitor controls" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open monitor controls" }).click();

  const panelBox = await page.locator(".monitor-controls-panel").boundingBox();
  expect(panelBox?.y).toBeGreaterThanOrEqual((headerBox?.height ?? 34) - 1);
  expect(panelBox?.width).toBeLessThanOrEqual(691);
  await expect(
    page.getByRole("heading", { name: "Plot signals", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Run data", exact: true }),
  ).toBeVisible();

  await page.mouse.click(650, 200);
  await expect(
    page.getByRole("button", { name: "Open monitor controls" }),
  ).toBeVisible();
  await expect(page.getByTestId("world-view")).toBeVisible();
});

test("uses tall narrow space and closes wide controls after a live resize", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.goto("/monitor/");
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(
    page.getByRole("button", { name: "Collapse monitor controls" }),
  ).toBeVisible();

  await page.setViewportSize({ width: 700, height: 1200 });
  await expect(
    page.getByRole("button", { name: "Open monitor controls" }),
  ).toBeVisible();

  const geometry = await page.evaluate(() => {
    const rectangle = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) throw new Error(`Missing ${selector}`);
      const box = element.getBoundingClientRect();
      return { bottom: box.bottom, height: box.height };
    };
    return {
      viewportHeight: innerHeight,
      workspace: rectangle(".monitor-workspace"),
      dashboard: rectangle(".dashboard-grid"),
      world: rectangle(".world-panel"),
      plots: rectangle(".plots-panel"),
    };
  });
  expect(geometry.workspace.bottom).toBeCloseTo(geometry.viewportHeight, 0);
  expect(geometry.dashboard.bottom).toBeCloseTo(geometry.viewportHeight, 0);
  expect(geometry.world.height).toBeGreaterThan(300);
  expect(geometry.plots.bottom).toBeCloseTo(geometry.viewportHeight, 0);
});

test("keeps every header command reachable without hidden scrolling at phone width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto("/monitor/");

  const header = page.locator(".app-header");
  await expect(header).toHaveCSS("overflow-x", "visible");
  await expect(
    page.getByRole("button", { name: "Run", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reset", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator(".app-navigation")
      .getByRole("link", { name: "IDE", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator(".app-navigation")
      .getByRole("link", { name: "Guide", exact: true }),
  ).toBeVisible();

  const boxes = await Promise.all([
    page.getByRole("button", { name: "Run", exact: true }).boundingBox(),
    page.getByRole("button", { name: "Reset", exact: true }).boundingBox(),
    ...["Home", "IDE", "Monitor", "Guide", "Set up or Repair", "API"].map(
      (name) =>
        page
          .locator(".app-navigation")
          .getByRole("link", { name, exact: true })
          .boundingBox(),
    ),
  ]);
  expect(
    boxes.every((box) => box && box.x >= 0 && box.x + box.width <= 375),
  ).toBe(true);
  await expect(page.getByTestId("world-view")).toHaveAttribute(
    "data-minimum-label-pixels",
    "9",
  );
  await expect(page.getByTestId("wheel-speed-plot")).toHaveAttribute(
    "data-compact-layout",
    "true",
  );
});

test("keeps a centered world preview visible without a published physical pose", async ({
  page,
}) => {
  await seedWorkingFolder(page, {
    folderName: monitorWorkspace,
    robot: {
      id: "unreachable-monitor-xrp",
      name: "ucsb-xrp-unreachable",
      networkMode: "station",
      ssid: "COURSE-NETWORK",
      address: "127.0.0.1:9",
    },
    target: "physical",
  });
  await page.goto("/monitor/");

  const world = page.getByTestId("world-view");
  await expect(world).toBeVisible();
  await expect(world).toHaveAttribute("data-pose-state", "centered-preview");
  await expect(
    page.getByText("Preview · no published pose", { exact: true }),
  ).toBeVisible();
  const worldGeometry = await world.evaluate((element) => {
    const host = element.querySelector<HTMLElement>(".world-canvas");
    return {
      canvasHeight: host?.querySelector("canvas")?.clientHeight ?? 0,
      canvasWidth: host?.querySelector("canvas")?.clientWidth ?? 0,
      hostHeight: host?.clientHeight ?? 0,
      hostWidth: host?.clientWidth ?? 0,
    };
  });
  expect(worldGeometry.canvasWidth).toBe(worldGeometry.hostWidth);
  expect(worldGeometry.canvasHeight).toBe(worldGeometry.hostHeight);
  expect(worldGeometry.hostWidth).toBeGreaterThan(100);
  expect(worldGeometry.hostHeight).toBeGreaterThan(100);
});
