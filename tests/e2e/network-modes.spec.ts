import { expect, test } from "@playwright/test";

import { readWorkspaceManifest, seedWorkingFolder } from "./working-folder";

test("shows the one commissioned XRP network from the Working folder", async ({
  page,
}) => {
  await seedWorkingFolder(page, {
    robot: {
      id: "network-mode-test-xrp",
      name: "ucsb-xrp-network-test",
      networkMode: "station",
      ssid: "COURSE-NETWORK",
      address: "192.168.7.44",
    },
    target: "physical",
  });
  await page.goto("/ide/");
  await page.getByRole("button", { name: "Settings", exact: true }).click();

  const settings = page.getByTestId("settings-panel");
  await expect(page.getByLabel("Run on")).toHaveValue("physical");

  const physical = settings.getByRole("group", { name: "Physical XRP" });
  await expect(physical).toContainText("ucsb-xrp-network-test");
  await expect(physical).toContainText("COURSE-NETWORK");
  await expect(physical).toContainText("http://192.168.7.44");
  await expect(
    physical.getByRole("link", { name: /Set up, repair, or change network/ }),
  ).toHaveAttribute("href", "../commission/");
  expect(await readWorkspaceManifest(page)).toMatchObject({
    schemaVersion: 1,
    settings: { target: "physical" },
    robot: {
      id: "network-mode-test-xrp",
      networkMode: "station",
      address: "192.168.7.44",
    },
  });
  await expect(physical.getByRole("combobox")).toHaveCount(0);
  await expect(physical.getByRole("textbox")).toHaveCount(0);
  await expect(settings).toContainText(
    "Run and telemetry use the network verified during XRP setup.",
  );
});
