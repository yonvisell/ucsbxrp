// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_TARGET_PREFERENCE, type RobotProfile } from "@ucsb-xrp/target";
import type { CourseDirectoryHandle } from "./course-folder";
import { useTargetPreference } from "./use-target-preference";

const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  update: vi.fn(),
  remembered: vi.fn(),
  changed: null as (() => void) | null,
}));
vi.mock("./workspace-target-preference", () => ({
  loadWorkspaceTargetPreference: mocks.load,
  updateWorkspaceTargetPreference: mocks.update,
}));
vi.mock("./course-folder", () => ({
  loadRememberedWorkspaceFolder: mocks.remembered,
  subscribeCourseFolderChanged: (callback: () => void) => {
    mocks.changed = callback;
    return () => {
      mocks.changed = null;
    };
  },
  WorkspaceManifestError: class WorkspaceManifestError extends Error {},
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const a = { name: "Working A" } as CourseDirectoryHandle;
const b = { name: "Working B" } as CourseDirectoryHandle;
const profileA: RobotProfile = {
  ...DEFAULT_TARGET_PREFERENCE,
  robotId: "robot-a",
};
const profileB: RobotProfile = {
  ...DEFAULT_TARGET_PREFERENCE,
  robotId: "robot-b",
  kind: "physical",
};
let root: Root | undefined;
let latest: ReturnType<typeof useTargetPreference>;
async function mount() {
  function App() {
    latest = useTargetPreference({ retainTarget: true });
    return null;
  }
  root = createRoot(document.createElement("div"));
  await act(async () => {
    root!.render(createElement(App));
  });
}
afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
  vi.resetAllMocks();
});

describe("mounted Project target binding", () => {
  it("keeps A and its robot when another tab selects B or changes A's robot", async () => {
    mocks.remembered.mockResolvedValue(a);
    mocks.load.mockResolvedValue(profileA);
    await mount();
    expect(latest[0].robotId).toBe("robot-a");
    mocks.remembered.mockResolvedValue(b);
    mocks.load.mockResolvedValue(profileB);
    await act(async () => {
      mocks.changed!();
    });
    expect(latest[0].robotId).toBe("robot-a");
    expect(latest[5]).toContain("Working B");
    mocks.remembered.mockResolvedValue(a);
    await act(async () => {
      mocks.changed!();
    });
    expect(latest[0].robotId).toBe("robot-a");
    expect(latest[5]).toContain("different XRP settings");
    await act(async () => {
      await latest[4](b);
    });
    expect(latest[0].robotId).toBe("robot-b");
    expect(latest[5]).toBeNull();
  });

  it("ignores a late initial read after explicit adoption and retains A after failed adoption", async () => {
    let release!: (value: RobotProfile) => void;
    mocks.remembered.mockResolvedValue(a);
    mocks.load.mockImplementation((folder: CourseDirectoryHandle) =>
      folder === a
        ? new Promise<RobotProfile>((resolve) => {
            release = resolve;
          })
        : Promise.resolve(profileB),
    );
    await mount();
    await act(async () => {
      await latest[4](b);
      release(profileA);
    });
    expect(latest[0].robotId).toBe("robot-b");
    mocks.load.mockRejectedValue(new Error("Permission revoked"));
    await act(async () => {
      await expect(latest[4](a)).rejects.toThrow("Permission revoked");
    });
    expect(latest[0].robotId).toBe("robot-b");
  });

  it("invalidates the native before-close fence when a newer binding supersedes a target write", async () => {
    mocks.remembered.mockResolvedValue(a);
    mocks.load.mockResolvedValue(profileA);
    let finish!: () => void;
    let fence!: () => void;
    mocks.update.mockImplementation(
      async (
        _update: unknown,
        folder: CourseDirectoryHandle,
        options: { assertCurrent: () => void },
      ) => {
        expect(folder).toBe(a);
        fence = options.assertCurrent;
        await new Promise<void>((resolve) => {
          finish = resolve;
        });
        fence();
        return profileA;
      },
    );
    await mount();
    await act(async () => {
      latest[1]((current) => ({ ...current, kind: "physical" }));
    });
    mocks.load.mockResolvedValue(profileB);
    await act(async () => {
      await latest[4](b);
    });
    expect(() => fence()).toThrow("Target selection changed");
    await act(async () => {
      finish();
    });
    expect(latest[0].robotId).toBe("robot-b");
    expect(latest[3]).toBeNull();
  });
});
