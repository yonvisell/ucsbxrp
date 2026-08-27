import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  FirmwareRequiredError,
  commissionDevice,
  hotspotSsidForLastName,
  inspectDevice,
  installFirmware,
  robotHostnameForId,
  requireMatchingCommissioningRelease,
  type CommissioningManifest,
} from "./commissioner";
import type { MicroPythonSession, ReplResult } from "./web-serial";

const encoder = new TextEncoder();
const manifestUrl = new URL(
  "https://course.test/course/commissioning/releases/28/manifest.json",
);
const courseFile = encoder.encode("course release\n");
const courseBoot = encoder.encode(
  "def prepare_runtime_imports():\n return {}\n",
);
const mainFile = encoder.encode("import course_boot\ncourse_boot.boot()\n");

function digest(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function manifest(): CommissioningManifest {
  const runtimeManifest = encoder.encode(
    `${JSON.stringify({
      schemaVersion: 1,
      releaseId: "2026.08-dev.28",
      releaseSequence: 28,
      compatibility: {
        serviceVersion: "0.1.0",
        protocolVersion: 1,
        protocolRevision: 1,
        bootstrapVersion: 1,
        courseApiRevision: "0.4-draft",
        courseLibraryVersion: "0.4.0-dev",
        minimumRobotReleaseSequence: 28,
      },
      files: [
        {
          path: "lib/ucsb_xrp/example.py",
          bytes: courseFile.length,
          sha256: digest(courseFile),
        },
      ],
    })}\n`,
  );
  return {
    schemaVersion: 2,
    releaseId: "2026.08-dev.28",
    releaseSequence: 28,
    compatibility: {
      serviceVersion: "0.1.0",
      protocolVersion: 1,
      protocolRevision: 1,
      bootstrapVersion: 1,
      courseApiRevision: "0.4-draft",
      courseLibraryVersion: "0.4.0-dev",
      minimumRobotReleaseSequence: 28,
    },
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
        url: "firmware/sha256/test-digest/xrp.uf2",
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
    bootstrapFiles: [
      {
        destination: "/course_boot.py",
        url: "files/bootstrap/course_boot.py",
        bytes: courseBoot.length,
        sha256: digest(courseBoot),
        source: "device_service/course_boot.py",
      },
      {
        destination: "/main.py",
        url: "files/bootstrap/main.py",
        bytes: mainFile.length,
        sha256: digest(mainFile),
        source: "device_service/main.py",
      },
    ],
    runtime: {
      manifest: {
        url: "files/runtime/runtime-manifest.json",
        bytes: runtimeManifest.length,
        sha256: digest(runtimeManifest),
      },
      files: [
        {
          path: "lib/ucsb_xrp/example.py",
          url: "files/runtime/lib/ucsb_xrp/example.py",
          bytes: courseFile.length,
          sha256: digest(courseFile),
          source: "vendor/current/ucsb_xrp/example.py",
        },
      ],
    },
  };
}

function runtimeManifestData(value = manifest()): Uint8Array {
  return encoder.encode(
    `${JSON.stringify({
      schemaVersion: 1,
      releaseId: value.releaseId,
      releaseSequence: value.releaseSequence,
      compatibility: value.compatibility,
      files: value.runtime.files.map(({ path, bytes, sha256 }) => ({
        path,
        bytes,
        sha256,
      })),
    })}\n`,
  );
}

function jsonData(value: unknown): Uint8Array {
  return encoder.encode(`${JSON.stringify(value)}\n`);
}

function fullyInstalledFiles(): Map<string, Uint8Array> {
  const value = manifest();
  const record = {
    schemaVersion: 1,
    generation: 1,
    slot: "a",
    releaseId: value.releaseId,
    releaseSequence: value.releaseSequence,
    runtimeManifestSha256: value.runtime.manifest.sha256,
  };
  return new Map<string, Uint8Array>([
    ["/course_runtime/slots/a/lib/ucsb_xrp/example.py", courseFile],
    [
      "/course_runtime/slots/a/runtime-manifest.json",
      runtimeManifestData(value),
    ],
    ["/course_boot.py", courseBoot],
    ["/main.py", mainFile],
    ["/course_runtime/active.0.json", jsonData(record)],
    ["/course_runtime/confirmed.json", jsonData(record)],
  ]);
}

const fetchReleaseAsset = (async (input: URL | RequestInfo) => {
  const url = input instanceof URL ? input.href : String(input);
  if (url.endsWith("files/runtime/runtime-manifest.json")) {
    return new Response(runtimeManifestData().slice().buffer as ArrayBuffer);
  }
  if (url.endsWith("files/runtime/lib/ucsb_xrp/example.py")) {
    return new Response(courseFile);
  }
  if (url.endsWith("files/bootstrap/course_boot.py")) {
    return new Response(courseBoot);
  }
  if (url.endsWith("files/bootstrap/main.py")) {
    return new Response(mainFile);
  }
  throw new Error(`unexpected test URL ${url}`);
}) as typeof fetch;

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

  private jsonFile(path: string): unknown {
    const data = this.files.get(path);
    return data ? JSON.parse(new TextDecoder().decode(data)) : null;
  }

  async execute(code: string): Promise<ReplResult> {
    this.commands.push(code);
    if (code.includes("__UCSB_XRP_INSPECTION__=")) {
      return result(
        `__UCSB_XRP_INSPECTION__=${JSON.stringify({
          implementation: "micropython",
          version: [1, 28, 0],
          machine: "SparkFun XRP Controller with RP2350",
          robotId: "4c91fae8f1775aa4",
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
    if (code.includes("__UCSB_XRP_RUNTIME_STATE__=")) {
      return result(
        `__UCSB_XRP_RUNTIME_STATE__=${JSON.stringify({
          records: [
            this.jsonFile("/course_runtime/active.0.json"),
            this.jsonFile("/course_runtime/active.1.json"),
          ],
          confirmed: this.jsonFile("/course_runtime/confirmed.json"),
          attempted: this.jsonFile("/course_runtime/attempted.json"),
          slotManifests: {
            a: this.jsonFile("/course_runtime/slots/a/runtime-manifest.json"),
            b: this.jsonFile("/course_runtime/slots/b/runtime-manifest.json"),
          },
        })}\r\n`,
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
          protocol: 1,
          modules: this.requiredModules,
        })}\r\n`,
      );
    }
    if (code.includes("__UCSB_XRP_NETWORK__=")) {
      const profileBytes = this.files.get("/xrp_wifi.json");
      const profile = profileBytes
        ? (JSON.parse(new TextDecoder().decode(profileBytes)) as {
            mode?: "access_point" | "station";
            access_point?: { ssid?: string };
            station?: { ssid?: string };
          })
        : undefined;
      const mode = profile?.mode ?? "access_point";
      return result(
        `__UCSB_XRP_NETWORK__=${JSON.stringify({
          ready: true,
          mode,
          requested_mode: mode,
          fallback: false,
          ssid:
            mode === "station"
              ? profile?.station?.ssid
              : (profile?.access_point?.ssid ?? "UCSB-XRP-1234"),
          address: mode === "station" ? "192.168.7.34" : "192.168.4.1",
          status: "ready",
          channel: 6,
        })}\r\n`,
      );
    }
    if (code.includes("__UCSB_XRP_NETWORK_HOSTNAME__=")) {
      const hostname = code.match(/c\['hostname'\]=("[^"]+")/)?.[1];
      if (!hostname) throw new Error("hostname missing from test command");
      const profile = (this.jsonFile("/xrp_wifi.json") ?? {
        version: 2,
        mode: "access_point",
        access_point: { password: "ucsb-xrp" },
      }) as Record<string, unknown>;
      profile.hostname = JSON.parse(hostname) as string;
      this.files.set("/xrp_wifi.json", jsonData(profile));
      return result(
        `__UCSB_XRP_NETWORK_HOSTNAME__=${String(profile.hostname)}\r\n`,
      );
    }
    const open = code.match(/f=open\(("[^"]+"),'wb'\)/);
    if (open) {
      this.temporaryPath = JSON.parse(open[1]!) as string;
      this.temporaryData = [];
      return result();
    }
    if (code.includes("os.remove(p)")) {
      const pathsSource = code.match(/for p in (\[[^\n]+\]):/)?.[1];
      if (pathsSource) {
        for (const path of JSON.parse(pathsSource) as string[]) {
          this.files.delete(path);
        }
      }
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

  async resetAndClose(): Promise<void> {
    this.reset = true;
    this.closed = true;
  }

  async close(): Promise<void> {
    this.closed = true;
  }
}

describe("browser XRP commissioning", () => {
  it("rejects mixed page and commissioning releases before USB work", () => {
    expect(() =>
      requireMatchingCommissioningRelease(manifest(), "2026.08-dev.29"),
    ).toThrow(
      "Setup loaded robot files for 2026.08-dev.28, but this page is 2026.08-dev.29",
    );
    expect(() =>
      requireMatchingCommissioningRelease(manifest(), "2026.08-dev.28"),
    ).not.toThrow();
  });

  it("builds a portable optional hotspot name from a team member's last name", () => {
    expect(hotspotSsidForLastName(" Visell ")).toBe("UCSB-XRP-VISELL");
    expect(hotspotSsidForLastName(" ")).toBeUndefined();
    expect(() => hotspotSsidForLastName("Van Buren")).toThrow(
      "letters, numbers, and hyphens",
    );
    expect(() => hotspotSsidForLastName("A".repeat(24))).toThrow(
      "at most 23 characters",
    );
  });

  it("builds one stable local-network name from the verified controller", () => {
    expect(robotHostnameForId(" 4C91FAE8F1775AA4 ")).toBe(
      "ucsb-xrp-4c91fae8f1775aa4",
    );
    expect(robotHostnameForId(`abc${"1".repeat(24)}`)).toBe(
      `ucsb-xrp-${"1".repeat(16)}`,
    );
    expect(() => robotHostnameForId("not-a-controller-id")).toThrow(
      "stable identity",
    );
  });

  it("accepts only the pinned MicroPython controller runtime", async () => {
    const session = new FakeSession();
    await expect(inspectDevice(session, manifest())).resolves.toMatchObject({
      implementation: "micropython",
      version: [1, 28, 0],
      machine: "SparkFun XRP Controller with RP2350",
      robotId: "4c91fae8f1775aa4",
    });

    const wrongVersion: MicroPythonSession = {
      ...session,
      execute: async () =>
        result(
          `__UCSB_XRP_INSPECTION__=${JSON.stringify({
            implementation: "micropython",
            version: [1, 27, 0],
            machine: "SparkFun XRP Controller with RP2350",
            robotId: "4c91fae8f1775aa4",
            mpy: 774,
            modules: [],
          })}\r\n`,
        ),
      executeWithoutFollow: async () => undefined,
      resetAndClose: async () => undefined,
      close: async () => undefined,
    };
    await expect(
      inspectDevice(wrongVersion, manifest()),
    ).rejects.toBeInstanceOf(FirmwareRequiredError);
  });

  it("updates only changed files, verifies readback, configures Wi-Fi, and resets", async () => {
    const session = new FakeSession();
    const progress: string[] = [];
    const completed = await commissionDevice({
      session,
      manifest: manifest(),
      manifestUrl,
      robotId: "4c91fae8f1775aa4",
      network: { mode: "access_point", ssid: "UCSB-XRP-VISELL" },
      fetch: fetchReleaseAsset,
      onProgress: (next) => progress.push(next.detail),
    });

    expect(completed).toMatchObject({
      releaseSequence: 28,
      activationGeneration: 1,
      installedFiles: 4,
      unchangedFiles: 0,
      network: { ssid: "UCSB-XRP-VISELL", address: "192.168.4.1" },
    });
    expect(
      session.files.get("/course_runtime/slots/a/lib/ucsb_xrp/example.py"),
    ).toEqual(courseFile);
    const activation = session.commands.find((code) =>
      code.includes('os.rename("/course_runtime/active.0.json.commissioning"'),
    );
    expect(activation).toContain("os.rename");
    expect(
      JSON.parse(
        new TextDecoder().decode(
          session.files.get("/course_runtime/active.0.json")!,
        ),
      ),
    ).toMatchObject({
      generation: 1,
      slot: "a",
      releaseSequence: 28,
      runtimeManifestSha256: manifest().runtime.manifest.sha256,
    });
    expect(session.files.has("/xrp_wifi.json")).toBe(true);
    expect(
      JSON.parse(new TextDecoder().decode(session.files.get("/xrp_wifi.json")!))
        .access_point.ssid,
    ).toBe("UCSB-XRP-VISELL");
    expect(
      JSON.parse(new TextDecoder().decode(session.files.get("/xrp_wifi.json")!))
        .hostname,
    ).toBe("ucsb-xrp-4c91fae8f1775aa4");
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
    expect(progress).toContain("Verifying the new runtime…");
    expect(progress).toContain("Course runtime 2026.08-dev.28 is ready.");
    expect(session.reset).toBe(true);
    expect(session.closed).toBe(true);
  });

  it("is idempotent when every installed hash already matches", async () => {
    const session = new FakeSession(fullyInstalledFiles());
    const completed = await commissionDevice({
      session,
      manifest: manifest(),
      manifestUrl,
      robotId: "4c91fae8f1775aa4",
      network: { mode: "keep" },
      fetch: (async () => {
        throw new Error("matching files must not be fetched");
      }) as typeof fetch,
    });
    expect(completed.installedFiles).toBe(0);
    expect(completed.unchangedFiles).toBe(4);
    expect(completed.activationGeneration).toBe(1);
    expect(
      session.commands.filter((code) =>
        code.includes("/course_runtime/active.0.json.commissioning"),
      ),
    ).toHaveLength(0);
  });

  it("updates only the local hostname when retaining a network profile", async () => {
    const files = fullyInstalledFiles();
    files.set(
      "/xrp_wifi.json",
      jsonData({
        version: 2,
        mode: "station",
        hostname: "ucsb-xrp",
        station: { ssid: "Pink", password: "course-passphrase" },
        access_point: { password: "ucsb-xrp" },
      }),
    );
    const session = new FakeSession(files);
    await commissionDevice({
      session,
      manifest: manifest(),
      manifestUrl,
      robotId: "4c91fae8f1775aa4",
      network: { mode: "keep" },
      fetch: (async () => {
        throw new Error("matching files must not be fetched");
      }) as typeof fetch,
    });

    expect(
      JSON.parse(
        new TextDecoder().decode(session.files.get("/xrp_wifi.json")!),
      ),
    ).toEqual({
      version: 2,
      mode: "station",
      hostname: "ucsb-xrp-4c91fae8f1775aa4",
      station: { ssid: "Pink", password: "course-passphrase" },
      access_point: { password: "ucsb-xrp" },
    });
  });

  it("configures an existing Wi-Fi network without returning its password", async () => {
    const session = new FakeSession();
    const completed = await commissionDevice({
      session,
      manifest: manifest(),
      manifestUrl,
      robotId: "4c91fae8f1775aa4",
      network: {
        mode: "station",
        ssid: "Course network",
        password: "course-passphrase",
      },
      fetch: fetchReleaseAsset,
    });

    const stored = JSON.parse(
      new TextDecoder().decode(session.files.get("/xrp_wifi.json")!),
    ) as {
      mode: string;
      station: { ssid: string; password: string };
    };
    expect(stored).toMatchObject({
      mode: "station",
      station: {
        ssid: "Course network",
        password: "course-passphrase",
      },
    });
    expect(completed.network).toMatchObject({
      mode: "station",
      requested_mode: "station",
      ssid: "Course network",
      address: "192.168.7.34",
    });
    expect(JSON.stringify(completed)).not.toContain("course-passphrase");
  });

  it("repairs a damaged active runtime in the other slot and retains the confirmed fallback", async () => {
    const files = fullyInstalledFiles();
    files.set(
      "/course_runtime/slots/a/lib/ucsb_xrp/example.py",
      encoder.encode("damaged\n"),
    );
    const confirmedBefore = files.get("/course_runtime/confirmed.json")!;
    const session = new FakeSession(files);

    const completed = await commissionDevice({
      session,
      manifest: manifest(),
      manifestUrl,
      robotId: "4c91fae8f1775aa4",
      network: { mode: "keep" },
      fetch: fetchReleaseAsset,
    });

    expect(completed.activationGeneration).toBe(2);
    expect(
      session.files.get("/course_runtime/slots/b/lib/ucsb_xrp/example.py"),
    ).toEqual(courseFile);
    expect(session.files.get("/course_runtime/confirmed.json")).toEqual(
      confirmedBefore,
    );
    expect(
      JSON.parse(
        new TextDecoder().decode(
          session.files.get("/course_runtime/active.1.json")!,
        ),
      ),
    ).toMatchObject({ generation: 2, slot: "b" });
  });

  it("refuses an implicit downgrade before fetching or writing files", async () => {
    const newerManifest = encoder.encode(
      `${JSON.stringify({ releaseId: "2026.08-dev.29", releaseSequence: 29, files: [] })}\n`,
    );
    const newerDigest = digest(newerManifest);
    const newerRecord = {
      schemaVersion: 1,
      generation: 4,
      slot: "a",
      releaseId: "2026.08-dev.29",
      releaseSequence: 29,
      runtimeManifestSha256: newerDigest,
    };
    const session = new FakeSession(
      new Map([
        ["/course_runtime/slots/a/runtime-manifest.json", newerManifest],
        ["/course_runtime/active.1.json", jsonData(newerRecord)],
        ["/course_runtime/confirmed.json", jsonData(newerRecord)],
      ]),
    );
    let fetched = false;

    await expect(
      commissionDevice({
        session,
        manifest: manifest(),
        manifestUrl,
        robotId: "4c91fae8f1775aa4",
        network: { mode: "keep" },
        fetch: (async () => {
          fetched = true;
          throw new Error("must not fetch");
        }) as typeof fetch,
      }),
    ).rejects.toThrow("newer course runtime 2026.08-dev.29");
    expect(fetched).toBe(false);
    expect(
      session.commands.some((code) => code.includes(".commissioning")),
    ).toBe(false);
  });

  it("resets and closes after a failed installed-file readback", async () => {
    const session = new FakeSession();
    const originalExecute = session.execute.bind(session);
    let runtimeHashCalls = 0;
    session.execute = async (code: string) => {
      if (
        code.includes("__UCSB_XRP_HASHES__=") &&
        code.includes("slots/a/lib/ucsb_xrp/example.py") &&
        ++runtimeHashCalls === 2
      ) {
        return result(
          `__UCSB_XRP_HASHES__=${JSON.stringify({
            "/course_runtime/slots/a/lib/ucsb_xrp/example.py": "corrupt",
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
        robotId: "4c91fae8f1775aa4",
        network: { mode: "access_point" },
        fetch: (async (input: URL | RequestInfo) => {
          const url = input instanceof URL ? input.href : String(input);
          if (url.endsWith("runtime-manifest.json")) {
            return new Response(
              runtimeManifestData().slice().buffer as ArrayBuffer,
            );
          }
          if (url.endsWith("course_boot.py")) return new Response(courseBoot);
          if (url.endsWith("main.py")) return new Response(mainFile);
          return new Response(courseFile);
        }) as typeof fetch,
      }),
    ).rejects.toThrow("Readback verification failed");
    expect(session.files.has("/course_runtime/active.0.json")).toBe(false);
    expect(session.reset).toBe(true);
    expect(session.closed).toBe(true);
  });

  it("reports the installed and expected runtime versions", async () => {
    const session = new FakeSession(fullyInstalledFiles());
    const originalExecute = session.execute.bind(session);
    session.execute = async (code: string) => {
      if (code.includes("__UCSB_XRP_VERIFY__=")) {
        return result(
          `__UCSB_XRP_VERIFY__=${JSON.stringify({
            library: "0.3.0",
            protocol: 0,
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
        robotId: "4c91fae8f1775aa4",
        network: { mode: "keep" },
        fetch: (async () => {
          throw new Error("matching files must not be fetched");
        }) as typeof fetch,
      }),
    ).rejects.toThrow(
      "course library 0.3.0 (expected 0.4.0-dev); protocol 0 (expected 1)",
    );
    expect(session.reset).toBe(true);
    expect(session.closed).toBe(true);
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
      fetch: (async (input: URL | RequestInfo) => {
        expect(String(input)).toBe(
          "https://course.test/course/commissioning/releases/28/firmware/sha256/test-digest/xrp.uf2",
        );
        return new Response(Uint8Array.of(1, 2, 3, 4));
      }) as typeof fetch,
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
