import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createServer, type Server } from "node:http";

const release = JSON.parse(
  readFileSync(
    new URL("../../vendor/current/release.json", import.meta.url),
    "utf8",
  ),
) as { release_id: string };

let mockXrp: Server;
let mockXrpEndpoint = "";
let reachable = false;

test.beforeAll(async () => {
  mockXrp = createServer((request, response) => {
    if (!reachable) {
      request.socket.destroy();
      return;
    }
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
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
          address: "127.0.0.1",
          network: {
            mode: "station",
            ssid: "TEST-NETWORK",
            address: "127.0.0.1",
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
    response.writeHead(200, {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(body));
  });
  await new Promise<void>((resolve) => mockXrp.listen(0, "127.0.0.1", resolve));
  const address = mockXrp.address();
  if (!address || typeof address === "string") {
    throw new Error("Mock XRP did not bind a TCP port");
  }
  mockXrpEndpoint = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    mockXrp.close((error) => (error ? reject(error) : resolve())),
  );
});

test("keeps IDE and Monitor attached until the XRP Wi-Fi connection returns", async ({
  context,
  page: ide,
}) => {
  reachable = false;

  await context.addInitScript((endpoint) => {
    localStorage.setItem(
      "ucsb-xrp-target-v1",
      JSON.stringify({
        kind: "physical",
        physicalConnection: "station",
        physicalEndpoint: endpoint,
      }),
    );
  }, mockXrpEndpoint);

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
  await expect(ide.getByTestId("target-status")).toContainText(
    "Physical XRP · ready",
  );
  await expect(ide.getByRole("button", { name: "Validate" })).toBeEnabled();
  await expect(
    ide.getByRole("button", { name: "Flash project" }),
  ).toBeEnabled();

  await ide.getByRole("tab", { name: /System log/ }).click();
  await expect(ide.getByRole("log")).toContainText("Connected to ucsb-xrp");
  await expect(
    ide.getByRole("log").getByText("Connected to ucsb-xrp"),
  ).toHaveCount(1);
});
