import { describe, expect, it } from "vitest";

import {
  initialOfflineShellState,
  isLocalPreviewHostname,
  offlineShellAssetsNeedReload,
  offlineShellIsolationNeedsReload,
  offlineShellUpdateNeedsReload,
  virtualRunNeedsPreparation,
} from "./offline-shell";

describe("offline shell mode", () => {
  it("does not describe a development server as cached", () => {
    expect(initialOfflineShellState(false, true)).toBe("development");
  });

  it("reports missing browser support before attempting installation", () => {
    expect(initialOfflineShellState(true, false)).toBe("unsupported");
  });

  it("attempts installation only in a supported production build", () => {
    expect(initialOfflineShellState(true, true)).toBe("installing");
  });

  it("keeps local preview origins outside the production PWA cache", () => {
    expect(isLocalPreviewHostname("127.0.0.1")).toBe(true);
    expect(isLocalPreviewHostname("localhost")).toBe(true);
    expect(isLocalPreviewHostname("workshop.localhost")).toBe(true);
    expect(isLocalPreviewHostname("yonvisell.github.io")).toBe(false);
  });

  it("reloads each existing tab once when a newer release is signaled", () => {
    expect(offlineShellUpdateNeedsReload("old", "new", null)).toBe(true);
    expect(offlineShellUpdateNeedsReload("old", "new", "new")).toBe(false);
    expect(offlineShellUpdateNeedsReload("new", "new", null)).toBe(false);
    expect(offlineShellUpdateNeedsReload(null, "new", null)).toBe(false);
  });

  it("reloads an older page even when another tab already recorded the new release", () => {
    expect(
      offlineShellAssetsNeedReload(
        ["/assets/ide-old.js", "/assets/ide-old.css"],
        ["/assets/ide-new.js", "/assets/ide-new.css"],
      ),
    ).toBe(true);
    expect(
      offlineShellAssetsNeedReload(
        ["/assets/ide-new.js", "/assets/ide-new.css"],
        ["/assets/ide-new.js", "/assets/ide-new.css", "/assets/monitor-new.js"],
      ),
    ).toBe(false);
  });

  it("reloads once after installation to enable isolated runtime controls", () => {
    expect(offlineShellIsolationNeedsReload(false, "build-a", null)).toBe(true);
    expect(offlineShellIsolationNeedsReload(false, "build-a", "build-a")).toBe(
      false,
    );
    expect(offlineShellIsolationNeedsReload(true, "build-a", null)).toBe(false);
  });

  it("holds virtual Run only while a production page awaits isolation", () => {
    expect(virtualRunNeedsPreparation(true, false)).toBe(true);
    expect(virtualRunNeedsPreparation(true, true)).toBe(false);
    expect(virtualRunNeedsPreparation(false, false)).toBe(false);
  });
});
