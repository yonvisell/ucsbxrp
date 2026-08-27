import { expect, test } from "@playwright/test";

test("changes the explicit XRP Wi-Fi mode without cross-network fallback", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto("/ide/");
  await page.getByRole("button", { name: "Settings", exact: true }).click();

  const settings = page.getByTestId("settings-panel");
  await page.getByLabel("Run on").selectOption("physical");

  const wifi = settings.getByRole("group", { name: "XRP Wi-Fi" });
  await expect(wifi).toContainText(
    "Project flashing, controls, and telemetry use Wi-Fi",
  );
  const connection = wifi.getByLabel("Network", { exact: true });
  await expect(connection).toHaveValue("station");
  const address = wifi.getByLabel("XRP address");
  await expect(address).toBeVisible();
  await address.fill("http://192.168.7.44");
  await address.press("Tab");

  await connection.selectOption("access_point");
  await expect(wifi.getByLabel("XRP address")).toHaveCount(0);
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("ucsb-xrp-robot-profile-v2") ?? "null"),
  );
  expect(stored).toMatchObject({
    schemaVersion: 2,
    kind: "physical",
    physicalConnection: "access_point",
    stationEndpoint: "http://192.168.7.44",
    accessPointEndpoint: "http://192.168.4.1",
  });

  await connection.selectOption("station");
  await expect(wifi.getByLabel("XRP address")).toHaveValue(
    "http://192.168.7.44",
  );
});
