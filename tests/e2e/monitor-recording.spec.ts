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

  await monitor.getByRole("button", { name: "Start recording" }).click();
  await expect(monitor.getByText("Recording telemetry")).toBeVisible();
  await ide.getByRole("button", { name: "Run virtual XRP" }).click();

  await expect
    .poll(
      async () =>
        recordedCount(
          await monitor.getByTestId("recording-count").textContent(),
        ),
      { message: "the recorder should receive the running target's samples" },
    )
    .toBeGreaterThan(3);

  await monitor.getByRole("button", { name: "Stop recording" }).click();
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
    "source,pose_available,seq,t_ms,x_mm,y_mm,heading_rad,left_effort,right_effort,left_wheel_speed_mm_s,right_wheel_speed_mm_s,left_encoder_count,right_encoder_count,collision,range_mm,button_pressed,acceleration_x_mg,acceleration_y_mg,acceleration_z_mg,angular_rate_x_mdps,angular_rate_y_mdps,angular_rate_z_mdps,temperature_c,battery_v,sensor_error",
  );
  expect(rows.length).toBeGreaterThan(4);
  expect(rows[1]?.split(",")).toHaveLength(25);

  await monitor.getByRole("button", { name: "Clear recording" }).click();
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

  await page.getByRole("checkbox", { name: /Forward range/ }).check();
  await expect(page.getByTestId("strip-chart-range")).toBeVisible();
  await page.getByRole("checkbox", { name: /Motor effort/ }).uncheck();
  await expect(page.getByTestId("strip-chart-motor-effort")).toHaveCount(0);

  await page.getByLabel("Strip chart time window").fill("6");
  await expect(page.getByText("2 shown · 6 s")).toBeVisible();

  await page.getByRole("button", { name: "Collapse monitor controls" }).click();
  await expect(
    page.getByRole("button", { name: "Open monitor controls" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open monitor controls" }).click();
  await expect(page.getByRole("group", { name: "Target" })).toBeVisible();
});
