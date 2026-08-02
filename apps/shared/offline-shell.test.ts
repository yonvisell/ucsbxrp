import { describe, expect, it } from "vitest";

import {
  initialOfflineShellState,
  offlineShellUpdateNeedsReload,
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

  it("reloads one existing tab once when a newer offline build activates", () => {
    expect(offlineShellUpdateNeedsReload("old", "new", null)).toBe(true);
    expect(offlineShellUpdateNeedsReload("old", "new", "new")).toBe(false);
    expect(offlineShellUpdateNeedsReload("new", "new", null)).toBe(false);
    expect(offlineShellUpdateNeedsReload(null, "new", null)).toBe(false);
  });
});
