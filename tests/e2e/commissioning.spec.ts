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
  const landingGap = await page.evaluate(() => {
    const header = document.querySelector(".landing-header")!;
    const hero = document.querySelector(".landing-shell > .eyebrow")!;
    return (
      hero.getBoundingClientRect().top - header.getBoundingClientRect().bottom
    );
  });
  expect(landingGap).toBeGreaterThanOrEqual(40);
  expect(landingGap).toBeLessThan(140);
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
  const stepsHeight = await page
    .locator(".commission-steps")
    .evaluate((element) => element.getBoundingClientRect().height);
  expect(stepsHeight).toBeLessThan(120);
  await page.getByRole("button", { name: "Continue without folder" }).click();
  await expect(
    page.getByRole("heading", { name: "Connect the XRP by USB-C" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(
    page.getByRole("heading", { name: "Choose a course folder" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Exit setup" }).click();
  await expect(page).toHaveURL(/\/$/);
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
  await page.getByRole("button", { name: "Continue without folder" }).click();
  await page.getByRole("button", { name: "Choose connected XRP" }).click();

  await expect(
    page.getByText("The device chooser closed without selecting an XRP."),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByText("Setup log", { exact: true }).click();
  await expect(page.getByLabel("Setup log")).toContainText(
    "Device selection was cancelled",
  );
});

test("reports a busy USB port without misdiagnosing the XRP firmware", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const port = {
      readable: null,
      writable: null,
      getInfo: () => ({ usbVendorId: 0x1b4f, usbProductId: 0x0046 }),
      open: async () => {
        throw new DOMException("Port is already open", "InvalidStateError");
      },
      close: async () => undefined,
    };
    Object.defineProperty(navigator, "serial", {
      configurable: true,
      value: {
        getPorts: async () => [port],
        requestPort: async () => port,
      },
    });
  });

  await page.goto("/commission/");
  await page.getByRole("button", { name: "Continue without folder" }).click();
  await page.getByRole("button", { name: "Use this XRP" }).click();

  await expect(
    page.getByRole("heading", { name: "Connect the XRP by USB-C" }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toContainText(
    "Close any other setup page using the XRP",
  );
  await expect(
    page.getByRole("heading", { name: "Install course firmware" }),
  ).toHaveCount(0);
});

test("replaces a retained course root without carrying over its active project", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    localStorage.clear();
    const root = await navigator.storage.getDirectory();
    for (const name of ["old-course", "new-course"]) {
      try {
        await root.removeEntry(name, { recursive: true });
      } catch (error) {
        if (
          !(error instanceof DOMException) ||
          error.name !== "NotFoundError"
        ) {
          throw error;
        }
      }
    }
    const oldWorkspace = await root.getDirectoryHandle("old-course", {
      create: true,
    });
    const oldProject = await oldWorkspace.getDirectoryHandle("Old-Project", {
      create: true,
    });
    const write = async (
      directory: FileSystemDirectoryHandle,
      name: string,
      content: string,
    ) => {
      const file = await directory.getFileHandle(name, { create: true });
      const writable = await file.createWritable();
      await writable.write(content);
      await writable.close();
    };
    await write(
      oldProject,
      ".ucsb-xrp-project.json",
      `${JSON.stringify({ name: "Old project", entrypoint: "main.py" })}\n`,
    );
    await write(oldProject, "main.py", 'print("old project")\n');
    await root.getDirectoryHandle("new-course", { create: true });

    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("ucsb-xrp-course-tools-v1", 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("course-folders")) {
          request.result.createObjectStore("course-folders");
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("course-folders", "readwrite");
      const store = transaction.objectStore("course-folders");
      store.put(oldWorkspace, "workspace-folder-v1");
      store.put(oldProject, "project-folder-v1");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
  });
  await page.addInitScript(() => {
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () =>
        (await navigator.storage.getDirectory()).getDirectoryHandle(
          "new-course",
        ),
    });
  });

  await page.goto("/commission/");
  await expect(
    page.getByRole("button", { name: "Use old-course" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Choose different folder" }).click();
  await expect(
    page.getByRole("button", { name: "Use new-course" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Use new-course" }).click();
  await expect(
    page.getByRole("heading", { name: "Connect the XRP by USB-C" }),
  ).toBeVisible();

  const retained = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("ucsb-xrp-course-tools-v1", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const read = (key: string) =>
      new Promise<FileSystemDirectoryHandle | undefined>((resolve, reject) => {
        const transaction = database.transaction("course-folders", "readonly");
        const request = transaction.objectStore("course-folders").get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    const workspace = await read("workspace-folder-v1");
    const project = await read("project-folder-v1");
    database.close();
    const root = await navigator.storage.getDirectory();
    const oldProject = await (
      await root.getDirectoryHandle("old-course")
    ).getDirectoryHandle("Old-Project");
    const oldMain = await (await oldProject.getFileHandle("main.py")).getFile();
    const newMain = await (
      await (
        await root.getDirectoryHandle("new-course")
      ).getDirectoryHandle("Expanding-Spiral")
    ).getFileHandle("main.py");
    return {
      workspace: workspace?.name,
      project: project?.name,
      oldMain: await oldMain.text(),
      newMain: await (await newMain.getFile()).text(),
    };
  });
  expect(retained).toMatchObject({
    workspace: "new-course",
    project: "Expanding-Spiral",
    oldMain: 'print("old project")\n',
  });
  expect(retained.newMain).toContain("spiral_winding_turns_per_m");
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

    const selectedFolderName = "My XRP Projects";
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () => {
        const root = await navigator.storage.getDirectory();
        try {
          await root.removeEntry(selectedFolderName, { recursive: true });
        } catch (error) {
          if (
            !(error instanceof DOMException) ||
            error.name !== "NotFoundError"
          ) {
            throw error;
          }
        }
        return root.getDirectoryHandle(selectedFolderName, { create: true });
      },
    });
    Object.defineProperty(window, "__readUcsbTestCourseFile", {
      configurable: true,
      value: async (path: string) => {
        try {
          const parts = path.split("/");
          const fileName = parts.pop()!;
          let directory = await (
            await navigator.storage.getDirectory()
          ).getDirectoryHandle(selectedFolderName);
          for (const part of parts) {
            directory = await directory.getDirectoryHandle(part);
          }
          const file = await directory.getFileHandle(fileName);
          return (await file.getFile()).text();
        } catch (error) {
          if (error instanceof DOMException && error.name === "NotFoundError") {
            return "";
          }
          throw error;
        }
      },
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
      resetDelayMs = 0;

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
          const code = textDecoder.decode(Uint8Array.from(this.command));
          if (this.resetDelayMs > 0 && code.includes("machine.reset()")) {
            await new Promise((resolve) =>
              window.setTimeout(resolve, this.resetDelayMs),
            );
          }
          this.send(Uint8Array.of(4));
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
            stdout: `__UCSB_XRP_NETWORK_PROFILE__=${JSON.stringify({
              present: true,
              mode: "access_point",
              accessPointSsid: "UCSB-XRP-4A21",
            })}\r\n`,
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
              service: "2026.08-dev.20",
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
    Object.defineProperty(window, "__setUcsbXrpResetDelay", {
      configurable: true,
      value: (milliseconds: number) => {
        port.resetDelayMs = milliseconds;
      },
    });
    Object.defineProperty(navigator, "serial", {
      configurable: true,
      value: {
        requestPort: async () => port,
        getPorts: async () => [port],
      },
    });

    const originalFetch = window.fetch.bind(window);
    let serviceProbeCount = 0;
    Object.defineProperty(window, "__ucsbServiceProbeCount", {
      configurable: true,
      get: () => serviceProbeCount,
    });
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
            serviceVersion: "2026.08-dev.20",
            courseRelease: "2026.08-dev.20",
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
  await expect
    .poll(() =>
      page.evaluate(() =>
        (
          window as unknown as {
            __readUcsbTestCourseFile: (path: string) => Promise<string>;
          }
        ).__readUcsbTestCourseFile("UCSB_XRP_Autosaves/xrp-setup-latest.txt"),
      ),
    )
    .toContain("Write and read verified");
  await page.getByRole("button", { name: "Use My XRP Projects" }).click();
  await expect(
    page.getByRole("heading", { name: "Connect the XRP by USB-C" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Use this XRP" }).click();

  await expect(
    page.getByRole("heading", { name: "Choose the robot network" }),
  ).toBeVisible();
  await expect(page.getByLabel("Keep current robot hotspot")).toBeChecked();
  await expect(page.getByLabel("Robot hotspot", { exact: true })).toHaveCount(
    0,
  );
  const hotspotName = page.getByLabel(
    /Enter one team member's last name to give this robot a unique Wi-Fi hotspot name/,
  );
  await hotspotName.fill("Visell");
  await expect(
    page.getByText("Hotspot: UCSB-XRP-VISELL", { exact: false }),
  ).toBeVisible();
  await hotspotName.fill("");
  await page
    .getByRole("button", { name: "Check and repair course software" })
    .click();

  await expect(
    page.getByRole("heading", { name: "Connect the XRP by USB-C" }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toContainText(
    "simulated USB disconnect",
  );
  await expect(page.getByText("Setup log", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Use this XRP" }).click();
  await expect(
    page.getByRole("heading", { name: "Choose the robot network" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Check and repair course software" })
    .click();

  await expect(
    page.getByRole("heading", { name: "Verify the robot connection" }),
  ).toBeVisible({ timeout: 60_000 });
  await expect(
    page.getByRole("definition").filter({ hasText: "UCSB-XRP-4A21" }),
  ).toBeVisible();
  await expect(page.getByText("ucsb-xrp", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "Connection not checked yet" }),
  ).toContainText("waits for you");
  expect(
    await page.evaluate(
      () =>
        (
          window as unknown as {
            __ucsbServiceProbeCount: number;
          }
        ).__ucsbServiceProbeCount,
    ),
  ).toBe(0);
  await page
    .getByRole("button", { name: "I joined UCSB-XRP-4A21 — check XRP" })
    .click();
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
  await expect(page.getByTestId("project-folder")).toHaveText(
    "./Expanding-Spiral",
  );
  await expect
    .poll(() =>
      page.evaluate(() =>
        (
          window as unknown as {
            __readUcsbTestCourseFile: (path: string) => Promise<string>;
          }
        ).__readUcsbTestCourseFile("Expanding-Spiral/main.py"),
      ),
    )
    .toContain("spiral_winding_turns_per_m");

  await page.goto("/commission/");
  await page.getByRole("button", { name: "Use My XRP Projects" }).click();
  await expect(
    page.getByRole("heading", { name: "Connect the XRP by USB-C" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Use this XRP" }).click();
  await expect(
    page.getByRole("heading", { name: "Choose the robot network" }),
  ).toBeVisible();
  await page.evaluate(() =>
    (
      window as unknown as {
        __setUcsbXrpResetDelay: (milliseconds: number) => void;
      }
    ).__setUcsbXrpResetDelay(450),
  );
  await page.getByRole("link", { name: "Guide", exact: true }).click();
  await expect(page.getByTestId("setup-navigation-status")).toHaveText(
    "Opening Guide…",
  );
  await expect(
    page.getByRole("link", { name: "IDE", exact: true }),
  ).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByRole("button", { name: "Exit setup" })).toBeDisabled();
  await expect(page).toHaveURL(/\/guide\/$/);
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
