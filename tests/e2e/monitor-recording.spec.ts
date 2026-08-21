import { readFile } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

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

test("records a bounded telemetry window and exports explicit CSV columns", async ({
  context,
  page: ide,
}) => {
  await ide.goto("/ide/");
  const monitor = await context.newPage();
  await monitor.goto("/dashboard/");

  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(monitor.getByTestId("x-mm")).toBeVisible();

  await monitor.getByRole("button", { name: "Record", exact: true }).click();
  await expect(monitor.getByTestId("recording-count")).toContainText(
    "Recording · 0 samples",
  );
  await ide.getByRole("button", { name: "Run", exact: true }).click();

  await expect
    .poll(
      async () =>
        recordedCount(
          await monitor.getByTestId("recording-count").textContent(),
        ),
      { message: "the recorder should receive the running target's samples" },
    )
    .toBeGreaterThan(3);

  await monitor.getByLabel("Plot annotation").fill("turn begins");
  await monitor.getByRole("button", { name: "Add note" }).click();
  await expect(
    monitor.getByRole("button", { name: "Hide notes · 1" }),
  ).toBeVisible();

  await monitor
    .locator(".monitor-controls")
    .getByRole("button", { name: "Stop", exact: true })
    .click();
  await expect(monitor.getByTestId("recording-count")).toContainText(
    "Stopped ·",
  );

  const downloadPromise = monitor.waitForEvent("download");
  await monitor.getByRole("button", { name: "Export CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(
    /^xrp-telemetry-\d{4}-\d{2}-\d{2}T.*\.csv$/,
  );
  const path = await download.path();
  expect(path).not.toBeNull();
  const csv = await readFile(path!, "utf8");
  const rows = csv.trimEnd().split("\n");
  expect(rows[0]).toBe(
    "source,pose_available,seq,t_s,x_mm,y_mm,heading_rad,left_drive_command,right_drive_command,left_wheel_speed_mm_s,right_wheel_speed_mm_s,left_encoder_count,right_encoder_count,collision,range_mm,button_pressed,acceleration_x_m_s2,acceleration_y_m_s2,acceleration_z_m_s2,angular_rate_x_rad_s,angular_rate_y_rad_s,angular_rate_z_rad_s,temperature_c,battery_v,sensor_error",
  );
  expect(rows.length).toBeGreaterThan(4);
  expect(rows[1]?.split(",")).toHaveLength(25);

  const svgDownloadPromise = monitor.waitForEvent("download");
  await monitor.getByRole("button", { name: "Plots SVG" }).click();
  const svgDownload = await svgDownloadPromise;
  expect(svgDownload.suggestedFilename()).toMatch(/^xrp-plots-.*\.svg$/);
  const svgPath = await svgDownload.path();
  expect(svgPath).not.toBeNull();
  const svg = await readFile(svgPath!, "utf8");
  expect(svg).toContain("UCSBXRP signal plots");
  expect(svg).toContain("turn begins");

  const pngDownloadPromise = monitor.waitForEvent("download");
  await monitor.getByRole("button", { name: "Plots PNG" }).click();
  const pngDownload = await pngDownloadPromise;
  expect(pngDownload.suggestedFilename()).toMatch(/^xrp-plots-.*\.png$/);
  const pngPath = await pngDownload.path();
  expect(pngPath).not.toBeNull();
  expect((await readFile(pngPath!)).byteLength).toBeGreaterThan(2_000);

  const webmDownloadPromise = monitor.waitForEvent("download", {
    timeout: 20_000,
  });
  await monitor.getByRole("button", { name: "World WebM" }).click();
  const webmDownload = await webmDownloadPromise;
  expect(webmDownload.suggestedFilename()).toMatch(/^xrp-world-.*\.webm$/);
  const webmPath = await webmDownload.path();
  expect(webmPath).not.toBeNull();
  expect((await readFile(webmPath!)).byteLength).toBeGreaterThan(1_000);

  await monitor
    .locator(".monitor-controls")
    .getByRole("button", { name: "Clear", exact: true })
    .click();
  await expect(monitor.getByTestId("recording-count")).toContainText(
    "0 samples · 10 min at 50 Hz capacity",
  );
  await expect(
    monitor.getByRole("button", { name: "Export CSV" }),
  ).toBeDisabled();
});

test("selects scrolling signals from a collapsible monitor sidebar", async ({
  context,
  page,
}) => {
  const ide = await context.newPage();
  await ide.goto("/ide/");
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await ide.getByRole("button", { name: "Run", exact: true }).click();
  await expect(
    ide.getByRole("button", { name: "Stop", exact: true }),
  ).toBeVisible();
  await ide.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(
    ide.getByRole("button", { name: "Run", exact: true }),
  ).toBeVisible();
  await page.goto("/dashboard/");
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(page.locator(".monitor-run-button")).toBeEnabled();

  const brand = page.locator(".brand");
  await expect(brand).toHaveAttribute("aria-label", "UCSBXRP Monitor");
  await expect(brand).toHaveText("UCSBXRP Monitor");
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
  const ideLink = page.getByRole("link", { name: "IDE ↗", exact: true });
  await expect(ideLink).toHaveAttribute("target", "_blank");
  await expect(ideLink).toHaveAttribute("rel", "noopener noreferrer");
  await expect(
    page.locator(".header-nav").getByText("|", { exact: true }),
  ).toBeVisible();
  const monitorRun = page.locator(".monitor-run-button");
  await expect(monitorRun).toHaveCSS("background-color", "rgb(0, 88, 138)");
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
  await expect(page.getByTestId("offline-readiness")).toBeVisible();
  await expect(page.getByTestId("wheel-speed-plot")).toBeVisible();
  await expect(page.getByTestId("strip-chart-motor-effort")).toBeVisible();
  expect(await visiblePlotHeights(page)).toEqual({
    "wheel-speed-plot": 180,
    "strip-chart-motor-effort": 180,
  });
  const controlsBox = await page.getByTestId("monitor-controls").boundingBox();
  const dashboardBox = await page.locator(".dashboard-grid").boundingBox();
  const sliderBox = await page
    .getByLabel("Strip chart time window")
    .boundingBox();
  expect(controlsBox?.width).toBeGreaterThan(165);
  expect(controlsBox?.width).toBeLessThan(185);
  expect(dashboardBox?.x).toBeGreaterThanOrEqual(
    (controlsBox?.x ?? 0) + (controlsBox?.width ?? 0) - 1,
  );
  expect(sliderBox?.height).toBeLessThanOrEqual(16);
  const liveControlsBox = await page
    .locator(".live-program-group")
    .boundingBox();
  expect(liveControlsBox?.y).toBeGreaterThan(
    (sliderBox?.y ?? 0) + (sliderBox?.height ?? 0),
  );
  await expect(page.locator("details.live-program-group")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Live controls", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".live-program-group summary")).toHaveCount(0);

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
  await expect(page.getByTestId("offline-readiness")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Open monitor controls" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open monitor controls" }).click();
  await expect(
    page.getByRole("heading", { name: "Signals", exact: true }),
  ).toBeVisible();
});

test("keeps the Monitor compact and operable at laptop-narrow width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 691, height: 752 });
  await page.goto("/dashboard/");
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  const headerBox = await page.locator(".app-header").boundingBox();
  expect(headerBox?.height).toBeLessThanOrEqual(29);
  await expect(
    page.getByRole("button", { name: "Open monitor controls" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open monitor controls" }).click();

  const panelBox = await page.locator(".monitor-controls-panel").boundingBox();
  expect(panelBox?.y).toBeGreaterThanOrEqual((headerBox?.height ?? 34) - 1);
  expect(panelBox?.width).toBeLessThanOrEqual(691);
  await expect(
    page.getByRole("heading", { name: "Signals", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Recording", exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Collapse monitor controls" }).click();
  await expect(page.getByTestId("world-view")).toBeVisible();
});

test("keeps a centered world preview visible without a published physical pose", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "ucsb-xrp-target-v1",
      JSON.stringify({
        kind: "physical",
        physicalEndpoint: "http://127.0.0.1:9",
      }),
    );
  });
  await page.goto("/dashboard/");

  const world = page.getByTestId("world-view");
  await expect(world).toBeVisible();
  await expect(world).toHaveAttribute("data-pose-state", "centered-preview");
  await expect(
    page.getByText("Preview · no published pose", { exact: true }),
  ).toBeVisible();
  const worldGeometry = await world.evaluate((element) => ({
    canvasHeight: element.querySelector("canvas")?.clientHeight ?? 0,
    canvasWidth: element.querySelector("canvas")?.clientWidth ?? 0,
    hostHeight: element.clientHeight,
    hostWidth: element.clientWidth,
  }));
  expect(worldGeometry.canvasWidth).toBe(worldGeometry.hostWidth);
  expect(worldGeometry.canvasHeight).toBe(worldGeometry.hostHeight);
  expect(worldGeometry.hostWidth).toBeGreaterThan(100);
  expect(worldGeometry.hostHeight).toBeGreaterThan(100);
});
