import { readFile } from "node:fs/promises";

import { expect, test } from "@playwright/test";

function recordedCount(text: string | null): number {
  return Number.parseInt((text ?? "").replaceAll(",", ""), 10);
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
  await expect(monitor.getByText("Recording telemetry")).toBeVisible();
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

  await monitor
    .locator(".monitor-controls")
    .getByRole("button", { name: "Stop", exact: true })
    .click();
  await expect(monitor.getByText("Recording stopped")).toBeVisible();

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
    "source,pose_available,seq,t_s,x_mm,y_mm,heading_rad,left_effort,right_effort,left_wheel_speed_mm_s,right_wheel_speed_mm_s,left_encoder_count,right_encoder_count,collision,range_mm,button_pressed,acceleration_x_m_s2,acceleration_y_m_s2,acceleration_z_m_s2,angular_rate_x_rad_s,angular_rate_y_rad_s,angular_rate_z_rad_s,temperature_c,battery_v,sensor_error",
  );
  expect(rows.length).toBeGreaterThan(4);
  expect(rows[1]?.split(",")).toHaveLength(25);

  await monitor
    .locator(".monitor-controls")
    .getByRole("button", { name: "Clear", exact: true })
    .click();
  await expect(monitor.getByTestId("recording-count")).toContainText(
    "0 / 30,000 samples",
  );
  await expect(
    monitor.getByRole("button", { name: "Export CSV" }),
  ).toBeDisabled();
});

test("selects scrolling signals from a collapsible monitor sidebar", async ({
  page,
}) => {
  await page.goto("/dashboard/");
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  await expect(page.getByTestId("monitor-controls")).toBeVisible();
  await expect(page.getByTestId("wheel-speed-plot")).toBeVisible();
  await expect(page.getByTestId("strip-chart-motor-effort")).toBeVisible();
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

  const worldValuesSeparator = page.getByRole("separator", {
    name: "Resize world and live values",
  });
  await expect(worldValuesSeparator).toHaveAttribute("aria-valuenow", "82");
  await worldValuesSeparator.focus();
  await worldValuesSeparator.press("ArrowLeft");
  await expect(worldValuesSeparator).toHaveAttribute("aria-valuenow", "80");

  await page.getByRole("checkbox", { name: /Forward range/ }).check();
  await expect(page.getByTestId("strip-chart-range")).toBeVisible();
  await page.getByRole("checkbox", { name: /Drive command/ }).uncheck();
  await expect(page.getByTestId("strip-chart-motor-effort")).toHaveCount(0);

  await page.getByLabel("Strip chart time window").fill("6");
  await expect(page.getByText("6 s", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Collapse monitor controls" }).click();
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
  expect(headerBox?.height).toBeLessThanOrEqual(36);
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
