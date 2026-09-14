import { describe, expect, it } from "vitest";
import type { CourseDirectoryHandle } from "../../shared/course-folder";
import { SetupAttempt } from "./setup-attempt";
import {
  clearSetupCheckpoint,
  loadSetupCheckpoint,
  saveSetupCheckpoint,
  type SetupCheckpoint,
} from "./setup-checkpoint";

const checkpoint: SetupCheckpoint = {
  schemaVersion: 1,
  robotId: "4c91fae8f1775aa4",
  installedAtMs: 123,
  result: {
    releaseId: "test-release",
    releaseSequence: 1,
    serviceVersion: "test",
    runtimeManifestSha256: "a".repeat(64),
    activationGeneration: 3,
    installedFiles: 4,
    unchangedFiles: 5,
    network: {
      ready: true,
      mode: "access_point",
      requested_mode: "access_point",
      fallback: false,
      status: "ready",
      ssid: "UCSB-XRP-TEAM",
      address: "192.168.4.1",
    },
  },
};

function workingFolder() {
  let committed = "";
  let beforeClose: () => void = () => undefined;
  let aborted = false;
  const folder = {
    getFileHandle: async (_name: string, options?: { create?: boolean }) => {
      if (!committed && !options?.create)
        throw new DOMException("Missing", "NotFoundError");
      return {
        getFile: async () => new File([committed], "checkpoint.json"),
        createWritable: async () => {
          let pending = "";
          return {
            write: async (value: string) => {
              pending = value;
              beforeClose();
            },
            close: async () => {
              committed = pending;
            },
            abort: async () => {
              aborted = true;
            },
          };
        },
      };
    },
    removeEntry: async () => {
      committed = "";
    },
  } as unknown as CourseDirectoryHandle;
  return {
    folder,
    replace: (value: string) => {
      committed = value;
    },
    text: () => committed,
    beforeClose: (callback: () => void) => {
      beforeClose = callback;
    },
    aborted: () => aborted,
  };
}

describe("partial setup recovery", () => {
  it("restores exact installation evidence and preserves a newer checkpoint", async () => {
    const memory = workingFolder();
    await saveSetupCheckpoint(memory.folder, checkpoint, () => undefined);
    expect(await loadSetupCheckpoint(memory.folder, "test-release")).toEqual(
      checkpoint,
    );
    expect(
      await loadSetupCheckpoint(memory.folder, "other-release"),
    ).toBeNull();
    const newer = { ...checkpoint, installedAtMs: 456 };
    await saveSetupCheckpoint(memory.folder, newer, () => undefined);
    await clearSetupCheckpoint(memory.folder, checkpoint);
    expect(await loadSetupCheckpoint(memory.folder, "test-release")).toEqual(
      newer,
    );
    await clearSetupCheckpoint(memory.folder, newer);
    expect(await loadSetupCheckpoint(memory.folder, "test-release")).toBeNull();
  });

  it("aborts an obsolete context before its pending folder write commits", async () => {
    const memory = workingFolder();
    await saveSetupCheckpoint(memory.folder, checkpoint, () => undefined);
    const original = memory.text();
    const gate = new SetupAttempt();
    const attempt = gate.signal;
    memory.beforeClose(() => gate.invalidate());
    await expect(
      saveSetupCheckpoint(
        memory.folder,
        { ...checkpoint, installedAtMs: 456 },
        () => gate.requireCurrent(attempt),
      ),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(attempt.aborted).toBe(true);
    expect(gate.isCurrent(attempt)).toBe(false);
    expect(gate.isCurrent(gate.signal)).toBe(true);
    expect(memory.aborted()).toBe(true);
    expect(memory.text()).toBe(original);
  });

  it("ignores malformed, oversized, and unrelated saved evidence", async () => {
    const memory = workingFolder();
    for (const body of [
      "{",
      "x".repeat(16_385),
      JSON.stringify({ ...checkpoint, robotId: "wrong" }),
      JSON.stringify({ ...checkpoint, result: null }),
    ]) {
      memory.replace(body);
      expect(
        await loadSetupCheckpoint(memory.folder, "test-release"),
      ).toBeNull();
    }
  });
});
