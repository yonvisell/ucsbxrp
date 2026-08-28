import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const currentRelease = JSON.parse(
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
    protocol_version: number;
    protocol_revision: number;
    bootstrap_version: number;
  };
  ucsb_xrp: { version: string };
};

async function useTemporaryWorkingFolder(
  page: import("@playwright/test").Page,
  name: string,
) {
  await page.addInitScript((folderName) => {
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () => {
        const root = await navigator.storage.getDirectory();
        return root.getDirectoryHandle(folderName, { create: true });
      },
    });
  }, name);
}

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
    "Guide and overview",
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

test("shows the built-in starter as read-only until a Working folder is selected", async ({
  page,
}) => {
  await page.goto("/ide/");

  await expect(page.getByTestId("project-name")).toHaveText("Expanding spiral");
  await expect(page.getByTestId("project-folder")).toHaveText("Not selected");
  await expect(page.getByTestId("project-save-state")).toHaveText(
    "Working folder required",
  );
  await expect(page.getByRole("button", { name: "Compile" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Run" })).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "New file…", exact: true }),
  ).toBeDisabled();
});

test("keeps the commissioning steps readable without narrow-page overflow", async ({
  page,
}) => {
  await useTemporaryWorkingFolder(page, "narrow-test-work");
  await page.setViewportSize({ width: 375, height: 720 });
  await page.goto("/commission/");

  await expect(
    page.getByRole("heading", { name: "Choose a Working folder" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Choose Working folder" }),
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
  await page.getByRole("button", { name: "Choose Working folder" }).click();
  await expect(
    page.getByRole("heading", { name: "Connect the XRP by USB-C" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(
    page.getByRole("heading", { name: "Choose a Working folder" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Exit setup" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("explains a cancelled XRP device selection without an error", async ({
  page,
}) => {
  await useTemporaryWorkingFolder(page, "cancelled-device-test-work");
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
  await page.getByRole("button", { name: "Choose Working folder" }).click();
  await expect(page.getByText(/No XRP was selected/i)).toHaveCount(0);
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
  await useTemporaryWorkingFolder(page, "busy-device-test-work");
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
  await page.getByRole("button", { name: "Choose Working folder" }).click();
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

test("a new Working folder cannot inherit an earlier browser project", async ({
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
      `${JSON.stringify({
        name: "Old project",
        entrypoint: "main.py",
        session: {
          projectId: "commissioning-active-project-id",
          revision: 1,
          savedRevision: 1,
          updatedAt: 1_788_000_002_000,
        },
      })}\n`,
    );
    await write(oldProject, "main.py", 'print("old project")\n');
    await root.getDirectoryHandle("new-course", { create: true });
    localStorage.setItem(
      "ucsb-xrp-course-project-v2",
      JSON.stringify({
        name: "Old project",
        entrypoint: "main.py",
        files: { "main.py": 'print("old project")\n' },
        session: {
          projectId: "commissioning-active-project-id",
          revision: 1,
          savedRevision: 1,
          updatedAt: 1_788_000_002_000,
        },
      }),
    );

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
      store.put(oldProject, "active-project-folder-v2");
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
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Choose Working folder" }).click();
  await expect(
    page.getByRole("heading", { name: "Connect the XRP by USB-C" }),
  ).toBeVisible();
  await page.goto("/ide/");
  await expect(page.getByTestId("project-name")).toHaveText("Expanding spiral");
  await expect(page.getByTestId("project-folder")).toHaveText(
    "Expanding-Spiral",
  );
  await expect(
    page.getByRole("button", { name: "Open project…", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "New project…", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("project-save-state")).toHaveText("Saved");
  await page.reload();
  await expect(page.getByTestId("project-folder")).toHaveText(
    "Expanding-Spiral",
  );

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
    const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
      const transaction = database.transaction("course-folders", "readonly");
      const request = transaction.objectStore("course-folders").getAllKeys();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const workspace = await read("workspace-folder-capability-v1");
    const legacyWorkspace = await read("workspace-folder-v1");
    const legacyProject = await read("active-project-folder-v2");
    database.close();
    const root = await navigator.storage.getDirectory();
    const oldProject = await (
      await root.getDirectoryHandle("old-course")
    ).getDirectoryHandle("Old-Project");
    const oldMain = await (await oldProject.getFileHandle("main.py")).getFile();
    const newWorkspace = await root.getDirectoryHandle("new-course");
    const defaultProject =
      await newWorkspace.getDirectoryHandle("Expanding-Spiral");
    const main = await (
      await defaultProject.getFileHandle("main.py")
    ).getFile();
    const config = JSON.parse(
      await (
        await (await newWorkspace.getFileHandle(".ucsbxrp.json")).getFile()
      ).text(),
    ) as { activeProject?: string };
    return {
      workspace: workspace?.name,
      keys,
      legacyWorkspace: legacyWorkspace?.name,
      legacyProject: legacyProject?.name,
      oldMain: await oldMain.text(),
      defaultProjectMain: await main.text(),
      activeProject: config.activeProject,
    };
  });
  expect(retained.workspace).toBe("new-course");
  expect(retained.keys).toEqual(["workspace-folder-capability-v1"]);
  expect(retained.legacyWorkspace).toBeUndefined();
  expect(retained.legacyProject).toBeUndefined();
  expect(retained.oldMain).toBe('print("old project")\n');
  expect(retained.defaultProjectMain).toContain("spiral_winding_turns_per_m");
  expect(retained.activeProject).toBe("Expanding-Spiral");
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

  await page.addInitScript((currentRelease) => {
    if (!sessionStorage.getItem("ucsb-commission-test-initialized")) {
      localStorage.clear();
      sessionStorage.setItem("ucsb-commission-test-initialized", "true");
    }

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
        if (chunk.length === 1 && chunk[0] === 3) {
          this.send("\r\n>>> ");
          return;
        }
        if (chunk.length === 2 && chunk[0] === 13 && chunk[1] === 1) {
          this.send("raw REPL; CTRL-B to exit\r\n>");
          return;
        }
        if (!this.rawPaste && chunk.length === 1 && chunk[0] === 4) {
          this.send("soft reboot\r\nraw REPL; CTRL-B to exit\r\n>");
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
              robotId: "4c91fae8f1775aa4",
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
        if (code.includes("__UCSB_XRP_RUNTIME_STATE__=")) {
          const readJson = (path: string) => {
            const data = files.get(path);
            return data ? JSON.parse(textDecoder.decode(data)) : null;
          };
          return {
            stdout: `__UCSB_XRP_RUNTIME_STATE__=${JSON.stringify({
              records: [
                readJson("/course_runtime/active.0.json"),
                readJson("/course_runtime/active.1.json"),
              ],
              confirmed: readJson("/course_runtime/confirmed.json"),
              attempted: readJson("/course_runtime/attempted.json"),
              slotManifests: {
                a: readJson("/course_runtime/slots/a/runtime-manifest.json"),
                b: readJson("/course_runtime/slots/b/runtime-manifest.json"),
              },
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
              protocol: 1,
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
        if (code.includes("__UCSB_XRP_NETWORK_HOSTNAME__=")) {
          const hostname = code.match(/c\['hostname'\]=("[^"]+")/)?.[1];
          if (!hostname) throw new Error("network hostname missing");
          const value = JSON.parse(hostname) as string;
          files.set(
            "/xrp_wifi.json",
            textEncoder.encode(
              JSON.stringify({
                version: 2,
                mode: "access_point",
                hostname: value,
                access_point: {
                  ssid: "UCSB-XRP-4A21",
                  password: "ucsb-xrp",
                },
              }),
            ),
          );
          return {
            stdout: `__UCSB_XRP_NETWORK_HOSTNAME__=${value}\r\n`,
            stderr: "",
          };
        }
        if (code.includes("os.remove(p)")) {
          const source = code.match(/for p in (\[[^\n]+\]):/)?.[1];
          for (const path of JSON.parse(source ?? "[]") as string[]) {
            files.delete(path);
          }
          return { stdout: "", stderr: "" };
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
    let serviceRobotId = "0000000000000000";
    let serviceResponseDelayMs = 0;
    Object.defineProperty(window, "__ucsbServiceProbeCount", {
      configurable: true,
      get: () => serviceProbeCount,
    });
    Object.defineProperty(window, "__setUcsbServiceRobotId", {
      configurable: true,
      value: (robotId: string) => {
        serviceRobotId = robotId;
      },
    });
    Object.defineProperty(window, "__setUcsbServiceResponseDelay", {
      configurable: true,
      value: (milliseconds: number) => {
        serviceResponseDelayMs = milliseconds;
      },
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
        if (serviceResponseDelayMs > 0) {
          const delay = serviceResponseDelayMs;
          serviceResponseDelayMs = 0;
          await new Promise((resolve) => window.setTimeout(resolve, delay));
        }
        const runtimeManifest = files.get(
          "/course_runtime/slots/a/runtime-manifest.json",
        );
        return new Response(
          JSON.stringify({
            protocol: currentRelease.service.protocol_version,
            protocolRevision: currentRelease.service.protocol_revision,
            serviceVersion: currentRelease.service.version,
            courseRelease: currentRelease.release_id,
            runtimeRelease: currentRelease.release_id,
            runtimeReleaseSequence: currentRelease.release_sequence,
            runtimeGeneration: 1,
            runtimeManifestSha256: runtimeManifest
              ? await sha256(runtimeManifest)
              : null,
            courseApiRevision: currentRelease.course_api_revision,
            courseLibraryVersion: currentRelease.ucsb_xrp.version,
            bootstrapVersion: currentRelease.service.bootstrap_version,
            robotId: serviceRobotId,
            robotName: "ucsb-xrp-4c91fae8f1775aa4",
            address: "192.168.4.1",
            bootId: "test-boot",
            capabilities: [
              "project.check",
              "project.prepare",
              "program.run",
              "program.stop",
              "target.reset",
              "telemetry.poll",
            ],
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      }
      if (url === "http://192.168.4.1/api/v1/state?afterLogSeq=0") {
        return new Response(JSON.stringify({ bootId: "test-boot" }), {
          headers: { "Content-Type": "application/json" },
        });
      }
      return originalFetch(input, init);
    };
  }, currentRelease);

  await page.goto("/commission/");
  await expect(
    page.getByRole("heading", { name: "Choose a Working folder" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Choose Working folder" }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        (
          window as unknown as {
            __readUcsbTestCourseFile: (path: string) => Promise<string>;
          }
        ).__readUcsbTestCourseFile("UCSBXRP diagnostic log.txt"),
      ),
    )
    .toContain("Write and read verified");
  await expect(
    page.getByRole("heading", { name: "Connect the XRP by USB-C" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Use this XRP" }).click();

  await expect(
    page.getByRole("heading", { name: "Choose the robot network" }),
  ).toBeVisible();
  await expect(page.getByLabel("Keep UCSB-XRP-4A21")).toBeChecked();
  await expect(page.getByLabel("Robot hotspot", { exact: true })).toHaveCount(
    0,
  );
  await page.getByLabel("Connect to a Wi-Fi network").check();
  await page.getByLabel("Network name").fill("Course network");
  await page.getByLabel("Wi-Fi password").fill("short");
  await expect(
    page.getByRole("button", { name: "Install or repair course software" }),
  ).toBeDisabled();
  await expect(page.getByText(/at least 8 characters/)).toBeVisible();
  await page.getByLabel("Keep UCSB-XRP-4A21").check();
  const hotspotName = page.getByLabel(
    /Enter one team member's last name to give this robot a unique Wi-Fi hotspot name/,
  );
  await hotspotName.fill("Visell");
  await expect(
    page.getByText("Hotspot: UCSB-XRP-VISELL", { exact: false }),
  ).toBeVisible();
  await hotspotName.fill("");
  await page
    .getByRole("button", { name: "Install or repair course software" })
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
    .getByRole("button", { name: "Install or repair course software" })
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
  await expect(
    page.getByRole("status").filter({ hasText: "Robot service needs repair" }),
  ).toContainText("not the controller selected over USB-C");
  await page.evaluate(() =>
    (
      window as unknown as {
        __setUcsbServiceRobotId: (robotId: string) => void;
      }
    ).__setUcsbServiceRobotId("4c91fae8f1775aa4"),
  );
  await page.evaluate(() =>
    (
      window as unknown as {
        __setUcsbServiceResponseDelay: (milliseconds: number) => void;
      }
    ).__setUcsbServiceResponseDelay(1_200),
  );
  await page.getByRole("button", { name: "Check XRP again" }).click();
  await expect(page.getByRole("heading", { name: "XRP ready" })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText("Robot setup is complete")).toBeVisible();
  await page.getByRole("button", { name: "Open IDE" }).click();
  await expect(page).toHaveURL(/\/ide\/$/, { timeout: 10_000 });
  await expect(page.getByTestId("project-name")).toHaveText("Expanding spiral");
  await expect(page.getByTestId("project-folder")).toHaveText(
    "Expanding-Spiral",
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
  await expect
    .poll(() =>
      page.evaluate(async () =>
        JSON.parse(
          await (
            window as unknown as {
              __readUcsbTestCourseFile: (path: string) => Promise<string>;
            }
          ).__readUcsbTestCourseFile(".ucsbxrp.json"),
        ),
      ),
    )
    .toMatchObject({
      schemaVersion: 1,
      activeProject: "Expanding-Spiral",
      robot: {
        id: "4c91fae8f1775aa4",
        name: "ucsb-xrp-4c91fae8f1775aa4",
        networkMode: "access_point",
        ssid: "UCSB-XRP-4A21",
        address: "192.168.4.1",
      },
    });

  await page.goto("/commission/");
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
  await page.getByRole("button", { name: "Choose Working folder" }).click();

  await expect(
    page.getByRole("heading", { name: "Choose a Working folder" }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toContainText(
    "selected Working folder could not be written and read",
  );
  await page.getByText("Setup log", { exact: true }).click();
  await expect(page.getByLabel("Setup log")).toContainText(
    "Write check failed",
  );
});
