import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const release = JSON.parse(
  readFileSync(
    new URL("../../vendor/current/release.json", import.meta.url),
    "utf8",
  ),
) as { release_id: string };

const endpoint = "http://192.168.4.1";

test("blocks physical commands until the XRP Wi-Fi connection returns", async ({
  context,
  page: ide,
}) => {
  let reachable = false;

  await context.addInitScript(() => {
    localStorage.setItem(
      "ucsb-xrp-target-v1",
      JSON.stringify({
        kind: "physical",
        physicalConnection: "access_point",
        physicalEndpoint: "http://192.168.7.30",
      }),
    );
    Object.defineProperty(globalThis, "SharedWorker", {
      configurable: true,
      value: class UnavailableSharedWorker {
        constructor() {
          throw new Error("Use the direct test client");
        }
      },
    });
  });

  await context.route(`${endpoint}/api/v1/**`, async (route) => {
    if (!reachable) {
      await route.abort("failed");
      return;
    }
    const url = new URL(route.request().url());
    const common = {
      bootId: "network-recovery-boot",
      courseRelease: release.release_id,
      serviceVersion: release.release_id,
      protocol: 1,
      runtimeJson: '{"revision":0,"parameters":[],"watches":[],"plots":[]}',
      project: null,
    };
    const body = url.pathname.endsWith("/info")
      ? {
          ...common,
          robotName: "ucsb-xrp",
          address: "192.168.4.1",
          network: {
            mode: "access_point",
            ssid: "UCSB-XRP-TEST",
            address: "192.168.4.1",
            fallback: false,
          },
          capabilities: [
            "project.check",
            "project.sync",
            "program.run",
            "program.stop",
            "target.reset",
            "telemetry.poll",
          ],
        }
      : {
          ...common,
          state: "ready",
          detail: "Physical XRP ready",
          runId: 0,
          logs: [],
          samples: [],
          sample: null,
        };
    await route.fulfill({
      body: JSON.stringify(body),
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      status: 200,
    });
  });

  await ide.goto("/ide/");
  await expect(
    ide.getByRole("combobox", { name: "Project template" }),
  ).toHaveValue("");
  await expect(ide.getByRole("button", { name: "Create" })).toBeDisabled();
  await expect(ide.getByTestId("target-status")).toContainText(
    "Physical XRP · error · connection required",
  );
  await expect(
    ide.getByText(/Run and telemetry use Wi-Fi, not USB/),
  ).toBeVisible();
  await expect(ide.getByRole("button", { name: "Validate" })).toBeDisabled();
  await expect(
    ide.getByRole("button", { name: "Flash project" }),
  ).toBeDisabled();
  await expect(
    ide.getByRole("button", { name: "Run", exact: true }),
  ).toBeDisabled();
  await expect(ide.getByRole("button", { name: "Reset" })).toBeDisabled();

  reachable = true;
  await ide.getByRole("button", { name: "Retry XRP connection" }).click();
  await expect(ide.getByTestId("target-status")).toContainText(
    "Physical XRP · ready",
  );
  await expect(ide.getByRole("button", { name: "Validate" })).toBeEnabled();
  await expect(
    ide.getByRole("button", { name: "Flash project" }),
  ).toBeEnabled();

  reachable = false;
  const monitor = await context.newPage();
  await monitor.goto("/monitor/");
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Physical XRP · error",
  );
  await expect(monitor.getByText("XRP not reachable")).toBeVisible();
  await expect(
    monitor.getByText(/Run and telemetry use Wi-Fi, not USB/),
  ).toBeVisible();
  await expect(
    monitor.getByRole("button", { name: "Run", exact: true }),
  ).toBeDisabled();
  await expect(monitor.getByRole("button", { name: "Reset" })).toBeDisabled();

  reachable = true;
  await monitor.getByRole("button", { name: "Retry XRP connection" }).click();
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Physical XRP · ready",
  );
});
