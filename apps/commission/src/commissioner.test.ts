import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  FirmwareRequiredError,
  commissionDevice,
  inspectDevice,
  installFirmware,
  type CommissioningManifest,
} from "./commissioner";
import type { MicroPythonSession, ReplResult } from "./web-serial";

const encoder = new TextEncoder();
const manifestUrl = new URL(
  "https://course.test/course/commissioning/manifest.json",
);
const courseFile = encoder.encode("course release\n");

function digest(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function manifest(): CommissioningManifest {
  return {
    schemaVersion: 1,
    releaseId: "2026.08-dev.14",
    serviceVersion: "2026.08-dev.14",
    courseLibraryVersion: "0.4.0-dev",
    controller: {
      id: "sparkfun-xrp-controller-rp2350",
      usbVendorId: 0x1b4f,
      usbProductId: 0x0046,
    },
    micropython: {
      version: "1.28.0",
      board: "SPARKFUN_XRP_CONTROLLER",
      firmware: {
        asset: "xrp.uf2",
        url: "../current/firmware/xrp.uf2",
        bytes: 4,
        sha256: digest(Uint8Array.of(1, 2, 3, 4)),
      },
    },
    xrplib: {
      version: "test",
      requiredModules: ["XRPLib.board", "XRPLib.encoded_motor"],
    },
    networkDefaults: {
      mode: "access_point",
      password: "ucsb-xrp",
      address: "192.168.4.1",
    },
    files: [
      {
        destination: "/lib/ucsb_xrp/example.py",
        url: "files/lib/ucsb_xrp/example.py",
        bytes: courseFile.length,
        sha256: digest(courseFile),
        source: "vendor/current/ucsb_xrp/example.py",
      },
    ],
  };
}

function result(stdout = "", stderr = ""): ReplResult {
  return { stdout, stderr };
}

class FakeSession implements MicroPythonSession {
  readonly files: Map<string, Uint8Array>;
  readonly requiredModules: string[];
  readonly commands: string[] = [];
  reset = false;
  closed = false;
  private temporaryPath = "";
  private temporaryData: number[] = [];

  constructor(
    files = new Map<string, Uint8Array>(),
    requiredModules = manifest().xrplib.requiredModules,
  ) {
    this.files = files;
    this.requiredModules = requiredModules;
  }

  async execute(code: string): Promise<ReplResult> {
    this.commands.push(code);
    if (code.includes("__UCSB_XRP_INSPECTION__=")) {
      return result(
        `__UCSB_XRP_INSPECTION__=${JSON.stringify({
          implementation: "micropython",
          version: [1, 28, 0],
          machine: "SparkFun XRP Controller with RP2350",
          mpy: 774,
          modules: this.requiredModules,
        })}\r\n`,
      );
    }
    if (code.includes("__UCSB_XRP_NETWORK_PROFILE__=")) {
      return result(
        `__UCSB_XRP_NETWORK_PROFILE__=${JSON.stringify({ present: false })}\r\n`,
      );
    }
    if (code.includes("__UCSB_XRP_HASHES__=")) {
      const pathsSource = code.match(/for p in (\[[^\n]+\]):/)?.[1];
      if (!pathsSource) throw new Error("hash paths missing from test command");
      const hashes: Record<string, string | null> = {};
      for (const path of JSON.parse(pathsSource) as string[]) {
        const data = this.files.get(path);
        hashes[path] = data ? digest(data) : null;
      }
      return result(`__UCSB_XRP_HASHES__=${JSON.stringify(hashes)}\r\n`);
    }
    if (code.includes("__UCSB_XRP_VERIFY__=")) {
      return result(
        `__UCSB_XRP_VERIFY__=${JSON.stringify({
          library: "0.4.0-dev",
          service: "2026.08-dev.14",
          modules: this.requiredModules,
        })}\r\n`,
      );
    }
    if (code.includes("__UCSB_XRP_NETWORK__=")) {
      return result(
        `__UCSB_XRP_NETWORK__=${JSON.stringify({
          ready: true,
          mode: "access_point",
          requested_mode: "access_point",
          fallback: false,
          ssid: "UCSB-XRP-1234",
          address: "192.168.4.1",
          status: "ready",
          channel: 6,
        })}\r\n`,
      );
    }
    const open = code.match(/f=open\(("[^"]+"),'wb'\)/);
    if (open) {
      this.temporaryPath = JSON.parse(open[1]!) as string;
      this.temporaryData = [];
      return result();
    }
    const chunk = code.match(/a2b_base64\(("[A-Za-z0-9+/=]+")\)/);
    if (chunk) {
      this.temporaryData.push(
        ...Buffer.from(JSON.parse(chunk[1]!) as string, "base64"),
      );
      return result();
    }
    const rename = code.match(/os\.rename\(("[^"]+"),("[^"]+")\)/);
    if (rename) {
      expect(JSON.parse(rename[1]!)).toBe(this.temporaryPath);
      this.files.set(
        JSON.parse(rename[2]!) as string,
        Uint8Array.from(this.temporaryData),
      );
      return result();
    }
    return result();
  }

  async executeWithoutFollow(): Promise<void> {
    this.reset = true;
  }

  async close(): Promise<void> {
    this.closed = true;
  }
}

describe("browser XRP commissioning", () => {
  it("accepts only the pinned MicroPython controller runtime", async () => {
    const session = new FakeSession();
    await expect(inspectDevice(session, manifest())).resolves.toMatchObject({
      implementation: "micropython",
      version: [1, 28, 0],
      machine: "SparkFun XRP Controller with RP2350",
    });

    const wrongVersion: MicroPythonSession = {
      ...session,
      execute: async () =>
        result(
          `__UCSB_XRP_INSPECTION__=${JSON.stringify({
            implementation: "micropython",
            version: [1, 27, 0],
            machine: "SparkFun XRP Controller with RP2350",
            mpy: 774,
            modules: [],
          })}\r\n`,
        ),
      executeWithoutFollow: async () => undefined,
      close: async () => undefined,
    };
    await expect(
      inspectDevice(wrongVersion, manifest()),
    ).rejects.toBeInstanceOf(FirmwareRequiredError);
  });

  it("updates only changed files, verifies readback, configures Wi-Fi, and resets", async () => {
    const session = new FakeSession();
    const progress: string[] = [];
    const fetchImplementation = (async (input: URL | RequestInfo) => {
      const url = input instanceof URL ? input.href : String(input);
      if (url.endsWith("files/lib/ucsb_xrp/example.py")) {
        return new Response(courseFile);
      }
      throw new Error(`unexpected test URL ${url}`);
    }) as typeof fetch;

    const completed = await commissionDevice({
      session,
      manifest: manifest(),
      manifestUrl,
      network: { mode: "access_point" },
      fetch: fetchImplementation,
      onProgress: (next) => progress.push(next.detail),
    });

    expect(completed).toMatchObject({
      installedFiles: 1,
      unchangedFiles: 0,
      network: { ssid: "UCSB-XRP-1234", address: "192.168.4.1" },
    });
    expect(session.files.get("/lib/ucsb_xrp/example.py")).toEqual(courseFile);
    const activation = session.commands.find((code) =>
      code.includes('os.rename("/lib/ucsb_xrp/example.py.commissioning"'),
    );
    expect(activation).toContain("os.rename");
    expect(activation).not.toContain("os.remove");
    expect(session.files.has("/xrp_wifi.json")).toBe(true);
    const runtimeVerification = session.commands.find((code) =>
      code.includes("__UCSB_XRP_VERIFY__="),
    );
    expect(runtimeVerification).toContain("del sys.modules[name]");
    expect(runtimeVerification).toContain(
      "name.startswith('ucsb_xrp_service.')",
    );
    expect(runtimeVerification!.indexOf("del sys.modules[name]")).toBeLessThan(
      runtimeVerification!.indexOf("import ucsb_xrp, ucsb_xrp_service"),
    );
    expect(progress).toContain("Loading the installed course software…");
    expect(progress).toContain(
      "Installed course release 2026.08-dev.14 verified.",
    );
    expect(session.reset).toBe(true);
    expect(session.closed).toBe(true);
  });

  it("is idempotent when every installed hash already matches", async () => {
    const files = new Map<string, Uint8Array>([
      ["/lib/ucsb_xrp/example.py", courseFile],
    ]);
    const session = new FakeSession(files);
    const completed = await commissionDevice({
      session,
      manifest: manifest(),
      manifestUrl,
      network: { mode: "keep" },
      fetch: (async () => {
        throw new Error("matching files must not be fetched");
      }) as typeof fetch,
    });
    expect(completed.installedFiles).toBe(0);
    expect(completed.unchangedFiles).toBe(1);
  });

  it("does not reset after a failed installed-file readback", async () => {
    const session = new FakeSession();
    const originalExecute = session.execute.bind(session);
    let hashCalls = 0;
    session.execute = async (code: string) => {
      if (code.includes("__UCSB_XRP_HASHES__=") && ++hashCalls === 2) {
        return result(
          `__UCSB_XRP_HASHES__=${JSON.stringify({
            "/lib/ucsb_xrp/example.py": "corrupt",
          })}\r\n`,
        );
      }
      return originalExecute(code);
    };

    await expect(
      commissionDevice({
        session,
        manifest: manifest(),
        manifestUrl,
        network: { mode: "access_point" },
        fetch: (async () => new Response(courseFile)) as typeof fetch,
      }),
    ).rejects.toThrow("Readback verification failed");
    expect(session.reset).toBe(false);
  });

  it("reports the installed and expected runtime versions", async () => {
    const files = new Map<string, Uint8Array>([
      ["/lib/ucsb_xrp/example.py", courseFile],
    ]);
    const session = new FakeSession(files);
    const originalExecute = session.execute.bind(session);
    session.execute = async (code: string) => {
      if (code.includes("__UCSB_XRP_VERIFY__=")) {
        return result(
          `__UCSB_XRP_VERIFY__=${JSON.stringify({
            library: "0.3.0",
            service: "2026.08-dev.7",
            modules: manifest().xrplib.requiredModules,
          })}\r\n`,
        );
      }
      return originalExecute(code);
    };

    await expect(
      commissionDevice({
        session,
        manifest: manifest(),
        manifestUrl,
        network: { mode: "keep" },
        fetch: (async () => {
          throw new Error("matching files must not be fetched");
        }) as typeof fetch,
      }),
    ).rejects.toThrow(
      "course library 0.3.0 (expected 0.4.0-dev); course service 2026.08-dev.7 (expected 2026.08-dev.14)",
    );
    expect(session.reset).toBe(false);
  });

  it("writes only an integrity-checked firmware image to the selected volume", async () => {
    let written: Uint8Array | null = null;
    const volume = {
      name: "RP2350",
      getFileHandle: async () => ({
        createWritable: async () => ({
          write: async (data: Uint8Array) => {
            written = data;
          },
          close: async () => undefined,
        }),
      }),
    };
    await installFirmware({
      volume,
      manifest: manifest(),
      manifestUrl,
      fetch: (async () =>
        new Response(Uint8Array.of(1, 2, 3, 4))) as typeof fetch,
    });
    expect(written).toEqual(Uint8Array.of(1, 2, 3, 4));
  });

  it("rejects a firmware image that differs from the release digest", async () => {
    const volume = {
      name: "RP2350",
      getFileHandle: async () => {
        throw new Error("corrupt firmware must not reach the volume");
      },
    };
    await expect(
      installFirmware({
        volume,
        manifest: manifest(),
        manifestUrl,
        fetch: (async () =>
          new Response(Uint8Array.of(1, 2, 3, 5))) as typeof fetch,
      }),
    ).rejects.toThrow("integrity check");
  });
});
