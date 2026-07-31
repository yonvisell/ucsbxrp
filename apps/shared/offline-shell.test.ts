import { describe, expect, it } from "vitest";

import { initialOfflineShellState } from "./offline-shell";

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
});
