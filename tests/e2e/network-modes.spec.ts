import { expect, test } from "@playwright/test";

test("selects robot hotspot or existing Wi-Fi without losing either endpoint", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto("/ide/");
  await page.getByRole("button", { name: "Settings", exact: true }).click();

  const settings = page.getByTestId("settings-panel");
  await settings.getByLabel("Execution target").selectOption("physical");

  const wifi = settings.getByRole("group", { name: "XRP Wi-Fi" });
  await expect(wifi).toContainText(
    "Project flashing, controls, and telemetry use Wi-Fi",
  );
  const connection = wifi.getByLabel("Network", { exact: true });
  await expect(connection).toHaveValue("access_point");
  await expect(wifi.getByText(/192\.168\.42\.1/)).toBeVisible();
  await expect(wifi.getByLabel("XRP address")).toHaveCount(0);

  await connection.selectOption("station");
  const address = wifi.getByLabel("XRP address");
  await expect(address).toBeVisible();
  await address.fill("http://192.168.7.44");
  await address.press("Tab");

  await connection.selectOption("access_point");
  await expect(wifi.getByLabel("XRP address")).toHaveCount(0);
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("ucsb-xrp-target-v1") ?? "null"),
  );
  expect(stored).toMatchObject({
    kind: "physical",
    physicalConnection: "access_point",
    physicalEndpoint: "http://192.168.7.44",
  });

  await connection.selectOption("station");
  await expect(wifi.getByLabel("XRP address")).toHaveValue(
    "http://192.168.7.44",
  );
});
