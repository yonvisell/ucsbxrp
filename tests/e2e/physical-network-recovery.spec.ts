import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createServer, type Server } from "node:http";

const release = JSON.parse(
  readFileSync(
    new URL("../../vendor/current/release.json", import.meta.url),
    "utf8",
  ),
) as {
  release_id: string;
  release_sequence: number;
  course_api_revision: string;
  service: {
    version: string;
    protocol_revision: number;
    bootstrap_version: number;
  };
  ucsb_xrp: { version: string };
};

let mockXrp: Server;
let mockXrpEndpoint = "";
let reachable = false;
let serviceState: "ready" | "running" = "ready";
let rejectedCommand: "stop" | "reset" | null = null;

test.beforeAll(async () => {
  mockXrp = createServer(async (request, response) => {
    if (!reachable) {
      request.socket.destroy();
      return;
    }
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const responseHeaders = {
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    };
    if (request.method === "OPTIONS") {
      response.writeHead(204, responseHeaders);
      response.end();
      return;
    }
    const common = {
      bootId: "network-recovery-boot",
      courseRelease: release.release_id,
      runtimeRelease: release.release_id,
      runtimeReleaseSequence: release.release_sequence,
      courseApiRevision: release.course_api_revision,
      protocolRevision: release.service.protocol_revision,
      bootstrapVersion: release.service.bootstrap_version,
      courseLibraryVersion: release.ucsb_xrp.version,
      serviceVersion: release.service.version,
      protocol: 1,
      runtimeJson: '{"revision":0,"parameters":[],"watches":[],"plots":[]}',
      project: null,
    };
    if (request.method === "POST") {
      const chunks: Buffer[] = [];
      for await (const chunk of request) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const requestBody = JSON.parse(
        Buffer.concat(chunks).toString("utf8"),
      ) as {
        requestId?: string;
      };
      const command = url.pathname.split("/").pop() ?? "";
      const commandRejected =
        (command === "stop" || command === "reset") &&
        command === rejectedCommand;
      if (commandRejected) {
        response.writeHead(200, responseHeaders);
        response.end(
          JSON.stringify({
            protocol: 1,
            requestId: requestBody.requestId,
            ok: false,
            error: {
              code: "target_error",
              detail: `simulated ${command} rejection`,
            },
          }),
        );
        return;
      }
      if (command === "stop") serviceState = "ready";
      response.writeHead(200, responseHeaders);
      response.end(
        JSON.stringify({
          protocol: 1,
          requestId: requestBody.requestId,
          ok: true,
          result: {
            detail: `${command} accepted`,
            reconnecting: false,
            runtimeJson: common.runtimeJson,
          },
        }),
      );
      return;
    }
    const body = url.pathname.endsWith("/info")
      ? {
          ...common,
          robotName: "ucsb-xrp",
          address: mockXrpEndpoint,
          network: {
            mode: "station",
            ssid: "TEST-NETWORK",
            address: mockXrpEndpoint,
            fallback: false,
          },
          capabilities: [
            "project.check",
            "project.prepare",
            "program.run",
            "program.stop",
            "target.reset",
            "telemetry.poll",
          ],
        }
      : {
          ...common,
          state: serviceState,
          detail: "Physical XRP ready",
          runId: serviceState === "running" ? 1 : 0,
          logs: [],
          samples: [],
          sample: null,
        };
    response.writeHead(200, responseHeaders);
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
  serviceState = "ready";
  rejectedCommand = null;

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
  await expect(
    ide.getByRole("button", { name: "Create new project…" }),
  ).toBeDisabled();
  await expect(ide.getByTestId("target-status")).toContainText(
    "Physical XRP · error · connection required",
  );
  await expect(ide.getByTestId("target-status")).toHaveAttribute(
    "title",
    /Run and telemetry use Wi-Fi, not USB/,
  );
  await expect(ide.getByRole("button", { name: "Validate" })).toBeDisabled();
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
  await expect
    .poll(() =>
      ide.evaluate(() =>
        JSON.parse(localStorage.getItem("ucsb-xrp-robot-profile-v2") ?? "{}"),
      ),
    )
    .toMatchObject({
      schemaVersion: 2,
      kind: "physical",
      physicalConnection: "station",
      stationEndpoint: mockXrpEndpoint,
      accessPointEndpoint: "http://192.168.4.1",
      lastObservedNetwork: {
        mode: "station",
        address: mockXrpEndpoint,
        ssid: "TEST-NETWORK",
        fallback: false,
      },
    });

  await ide.getByRole("tab", { name: /System log/ }).click();
  await expect(ide.getByRole("log")).toContainText("Connected to ucsb-xrp");
  await expect(
    ide.getByRole("log").getByText("Connected to ucsb-xrp"),
  ).toHaveCount(1);
});

test("reports a rejected physical Stop in the IDE System log", async ({
  context,
  page: ide,
}) => {
  reachable = true;
  serviceState = "running";
  rejectedCommand = "stop";
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

  try {
    await ide.goto("/ide/");
    await expect(
      ide.getByRole("button", { name: "Stop", exact: true }),
    ).toBeEnabled();
    await ide.getByRole("button", { name: "Stop", exact: true }).click();
    await expect(ide.getByRole("log")).toContainText(
      "Stop did not complete · simulated stop rejection",
    );
  } finally {
    rejectedCommand = null;
    serviceState = "ready";
  }
});

test("reports a rejected physical Reset in the IDE System log", async ({
  context,
  page: ide,
}) => {
  reachable = true;
  serviceState = "ready";
  rejectedCommand = "reset";
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

  try {
    await ide.goto("/ide/");
    await expect(
      ide.getByRole("button", { name: "Reset", exact: true }),
    ).toBeEnabled();
    await ide.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(ide.getByRole("log")).toContainText(
      "Reset did not complete · simulated reset rejection",
    );
  } finally {
    rejectedCommand = null;
  }
});
