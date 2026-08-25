import { expect, test } from "@playwright/test";

test("keeps the compact landing actions clear at laptop-narrow width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 720 });
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Program, Simulate, and Run Live Telemetry for the XRP robot",
    }),
  ).toBeVisible();
  for (const name of [
    "Open IDE",
    "Open Monitor",
    "Getting started",
    "UCSB XRP API",
    "Open wizard for XRP initial set up or repair",
  ]) {
    await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("keeps the commissioning steps readable without narrow-page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 720 });
  await page.goto("/commission/");

  await expect(
    page.getByRole("heading", { name: "Choose a course folder" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Choose course folder" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByText("Verify robot connection", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Choose later" }).click();
  await expect(
    page.getByRole("heading", { name: "Connect the XRP by USB-C" }),
  ).toBeVisible();
});

test("explains a cancelled XRP device selection without an error", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "serial", {
      configurable: true,
      value: {
        getPorts: async () => [],
        requestPort: async () => {
          throw new DOMException(
            "No port selected by the user.",
            "NotFoundError",
          );
        },
      },
    });
  });
  await page.goto("/commission/");
  await page.getByRole("button", { name: "Choose later" }).click();
  await page.getByRole("button", { name: "Select connected XRP" }).click();

  await expect(page.getByText("No XRP was selected.")).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByText("Setup log", { exact: true }).click();
  await expect(page.getByLabel("Setup log")).toContainText(
    "Device selection was cancelled",
  );
});

test("commissions a new XRP from the public wizard and hands it to the IDE", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });

  await page.addInitScript(() => {
    localStorage.clear();

    const courseFolderFiles = new Map<string, string>();
    const makeCourseFolder = (prefix = "", name = "My XRP Project") => ({
      kind: "directory",
      name,
      async *entries() {},
      getDirectoryHandle: async (child: string) =>
        makeCourseFolder(`${prefix}${child}/`, child),
      getFileHandle: async (
        fileName: string,
        options?: { create?: boolean },
      ) => {
        const path = `${prefix}${fileName}`;
        if (!options?.create && !courseFolderFiles.has(path)) {
          throw new DOMException("File not found", "NotFoundError");
        }
        return {
          kind: "file",
          name: fileName,
          getFile: async () =>
            new File([courseFolderFiles.get(path) ?? ""], fileName),
          createWritable: async () => ({
            write: async (content: string) =>
              courseFolderFiles.set(path, content),
            close: async () => undefined,
          }),
        };
      },
      removeEntry: async (child: string) => {
        courseFolderFiles.delete(`${prefix}${child}`);
      },
      queryPermission: async () => "granted",
      requestPermission: async () => "granted",
    });
    const courseFolder = makeCourseFolder();
    Object.defineProperty(window, "__ucsbTestCourseFiles", {
      configurable: true,
      value: courseFolderFiles,
    });
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () => courseFolder,
    });

    const textEncoder = new TextEncoder();
    const textDecoder = new TextDecoder();
    const files = new Map<string, Uint8Array>();

    const sha256 = async (data: Uint8Array) => {
      const digest = await crypto.subtle.digest(
        "SHA-256",
        new Uint8Array(data),
      );
      return Array.from(new Uint8Array(digest), (value) =>
        value.toString(16).padStart(2, "0"),
      ).join("");
    };

    class MockXrpPort {
      readable: ReadableStream<Uint8Array> | null = null;
      writable: WritableStream<Uint8Array> | null = null;
      private controller: ReadableStreamDefaultController<Uint8Array> | null =
        null;
      private command: number[] = [];
      private rawPaste = false;
      private windowRemaining = 0;
      private temporaryPath = "";
      private temporaryData: number[] = [];
      private failFirstInstall = true;

      getInfo() {
        return { usbVendorId: 0x1b4f, usbProductId: 0x0046 };
      }

      async open() {
        this.readable = new ReadableStream<Uint8Array>({
          start: (controller) => {
            this.controller = controller;
          },
        });
        this.writable = new WritableStream<Uint8Array>({
          write: async (chunk) => this.receive(chunk),
        });
      }

      async close() {
        this.controller = null;
        this.readable = null;
        this.writable = null;
      }

      async setSignals() {}

      private send(value: Uint8Array | string) {
        this.controller?.enqueue(
          typeof value === "string" ? textEncoder.encode(value) : value,
        );
      }

      private async receive(chunk: Uint8Array) {
        if (chunk.length === 2 && chunk[0] === 13 && chunk[1] === 1) {
          this.send("raw REPL; CTRL-B to exit\r\n>");
          return;
        }
        if (
          chunk.length === 3 &&
          chunk[0] === 5 &&
          chunk[1] === 65 &&
          chunk[2] === 1
        ) {
          this.rawPaste = true;
          this.command = [];
          this.windowRemaining = 128;
          this.send(Uint8Array.of(82, 1, 128, 0));
          return;
        }
        if (this.rawPaste && chunk.length === 1 && chunk[0] === 4) {
          this.rawPaste = false;
          this.send(Uint8Array.of(4));
          const code = textDecoder.decode(Uint8Array.from(this.command));
          if (this.failFirstInstall && code.includes("__UCSB_XRP_HASHES__=")) {
            this.failFirstInstall = false;
            throw new Error("simulated USB disconnect");
          }
          const response = await this.execute(code);
          this.send(response.stdout);
          this.send(Uint8Array.of(4));
          this.send(response.stderr);
          this.send(Uint8Array.of(4, 62));
          return;
        }
        if (this.rawPaste) {
          this.command.push(...chunk);
          this.windowRemaining -= chunk.length;
          if (this.windowRemaining === 0) {
            this.windowRemaining = 128;
            this.send(Uint8Array.of(1));
          }
        }
      }

      private async execute(code: string) {
        if (code.includes("__UCSB_XRP_INSPECTION__=")) {
          return {
            stdout: `__UCSB_XRP_INSPECTION__=${JSON.stringify({
              implementation: "micropython",
              version: [1, 28, 0],
              machine: "SparkFun XRP Controller with RP2350",
              mpy: 774,
              modules: [
                "XRPLib.board",
                "XRPLib.encoded_motor",
                "XRPLib.imu",
                "XRPLib.rangefinder",
              ],
            })}\r\n`,
            stderr: "",
          };
        }
        if (code.includes("__UCSB_XRP_NETWORK_PROFILE__=")) {
          return {
            stdout: `__UCSB_XRP_NETWORK_PROFILE__=${JSON.stringify({ present: false })}\r\n`,
            stderr: "",
          };
        }
        if (code.includes("__UCSB_XRP_HASHES__=")) {
          const source = code.match(/for p in (\[[^\n]+\]):/)?.[1];
          const hashes: Record<string, string | null> = {};
          for (const path of JSON.parse(source ?? "[]") as string[]) {
            const data = files.get(path);
            hashes[path] = data ? await sha256(data) : null;
          }
          return {
            stdout: `__UCSB_XRP_HASHES__=${JSON.stringify(hashes)}\r\n`,
            stderr: "",
          };
        }
        if (code.includes("__UCSB_XRP_VERIFY__=")) {
          return {
            stdout: `__UCSB_XRP_VERIFY__=${JSON.stringify({
              library: "0.4.0-dev",
              service: "2026.08-dev.12",
              modules: [
                "XRPLib.board",
                "XRPLib.encoded_motor",
                "XRPLib.imu",
                "XRPLib.rangefinder",
              ],
            })}\r\n`,
            stderr: "",
          };
        }
        if (code.includes("__UCSB_XRP_NETWORK__=")) {
          return {
            stdout: `__UCSB_XRP_NETWORK__=${JSON.stringify({
              ready: true,
              mode: "access_point",
              requested_mode: "access_point",
              fallback: false,
              status: "ready",
              ssid: "UCSB-XRP-4A21",
              address: "192.168.4.1",
              channel: 6,
            })}\r\n`,
            stderr: "",
          };
        }
        const open = code.match(/f=open\(("[^"]+"),'wb'\)/);
        if (open) {
          this.temporaryPath = JSON.parse(open[1]!) as string;
          this.temporaryData = [];
          return { stdout: "", stderr: "" };
        }
        const chunk = code.match(/a2b_base64\(("[A-Za-z0-9+/=]+")\)/);
        if (chunk) {
          const binary = atob(JSON.parse(chunk[1]!) as string);
          this.temporaryData.push(
            ...Array.from(binary, (character) => character.charCodeAt(0)),
          );
          return { stdout: "", stderr: "" };
        }
        const rename = code.match(/os\.rename\(("[^"]+"),("[^"]+")\)/);
        if (rename) {
          files.set(
            JSON.parse(rename[2]!) as string,
            Uint8Array.from(this.temporaryData),
          );
        }
        return { stdout: "", stderr: "" };
      }
    }

    const port = new MockXrpPort();
    Object.defineProperty(navigator, "serial", {
      configurable: true,
      value: {
        requestPort: async () => port,
        getPorts: async () => [port],
      },
    });

    const originalFetch = window.fetch.bind(window);
    let serviceProbeCount = 0;
    window.fetch = async (input, init) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      if (url === "http://192.168.4.1/api/v1/info") {
        serviceProbeCount += 1;
        if (serviceProbeCount < 3) {
          throw new TypeError("computer has not joined the XRP hotspot yet");
        }
        return new Response(
          JSON.stringify({
            protocol: 1,
            serviceVersion: "2026.08-dev.12",
            courseRelease: "2026.08-dev.12",
            robotName: "UCSB-XRP-4A21",
            address: "192.168.4.1",
            bootId: "test-boot",
            capabilities: [
              "project.check",
              "project.sync",
              "program.run",
              "program.stop",
              "target.reset",
              "telemetry.poll",
            ],
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      }
      return originalFetch(input, init);
    };
  });

  await page.goto("/commission/");
  await expect(
    page.getByRole("heading", { name: "Choose a course folder" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Choose course folder" }).click();
  await expect(
    page.getByRole("heading", { name: "Connect the XRP by USB-C" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        (
          window as unknown as {
            __ucsbTestCourseFiles: Map<string, string>;
          }
        ).__ucsbTestCourseFiles.get("UCSB_XRP_Autosaves/xrp-setup-latest.txt"),
      ),
    )
    .toContain("Write and read verified");
  await page.getByRole("button", { name: "Select connected XRP" }).click();

  await expect(
    page.getByRole("heading", { name: "Choose the robot network" }),
  ).toBeVisible();
  await expect(page.getByLabel("Robot hotspot")).toBeChecked();
  await page.getByRole("button", { name: "Install or repair XRP" }).click();

  await expect(
    page.getByRole("heading", { name: "Connect the XRP by USB-C" }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toContainText(
    "simulated USB disconnect",
  );
  await expect(page.getByText("Setup log", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Select connected XRP" }).click();
  await expect(
    page.getByRole("heading", { name: "Choose the robot network" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Install or repair XRP" }).click();

  await expect(
    page.getByRole("heading", { name: "Verify the robot connection" }),
  ).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText("UCSB-XRP-4A21", { exact: true })).toBeVisible();
  await expect(page.getByText("ucsb-xrp", { exact: true })).toBeVisible();
  const connectionStatus = page
    .getByRole("status")
    .filter({ hasText: "Waiting for XRP" });
  await expect(connectionStatus).toContainText("Waiting for XRP · attempt 1");
  await expect(connectionStatus).toContainText(
    "computer has not joined the XRP hotspot yet",
  );
  await page.getByText("Setup log", { exact: true }).click();
  const visibleSetupLog = await page.getByLabel("Setup log").textContent();
  expect(visibleSetupLog).toContain("Attempt 1");
  expect(visibleSetupLog).not.toContain("ucsb-xrp");
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem("ucsb-xrp-target-v1") ?? "null"),
      ),
    )
    .toMatchObject({
      kind: "physical",
      physicalConnection: "access_point",
      physicalEndpoint: "http://192.168.4.1",
    });
  await expect(page).toHaveURL(/\/ide\/$/, { timeout: 10_000 });
  expect(browserErrors).toEqual([]);
});

test("does not advance when the selected folder fails its write check", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.clear();
    const folder = {
      kind: "directory",
      name: "Read only folder",
      async *entries() {},
      getDirectoryHandle: async () => folder,
      getFileHandle: async (name: string) => ({
        kind: "file",
        name,
        getFile: async () => new File([], name),
        createWritable: async () => ({
          write: async () => undefined,
          close: async () => undefined,
        }),
      }),
      removeEntry: async () => undefined,
      queryPermission: async () => "granted",
      requestPermission: async () => "granted",
    };
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () => folder,
    });
  });

  await page.goto("/commission/");
  await page.getByRole("button", { name: "Choose course folder" }).click();

  await expect(
    page.getByRole("heading", { name: "Choose a course folder" }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toContainText(
    "selected course folder could not be written and read",
  );
  await page.getByText("Setup log", { exact: true }).click();
  await expect(page.getByLabel("Setup log")).toContainText(
    "Write check failed",
  );
});
