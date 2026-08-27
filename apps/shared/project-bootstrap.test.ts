import { describe, expect, it } from "vitest";

import {
  PROJECT_BOOTSTRAP_KEY,
  beginProjectBootstrap,
  finishProjectBootstrap,
  projectBootstrapExpiresAt,
  projectBootstrapIsPending,
} from "./project-bootstrap";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

describe("shared project bootstrap", () => {
  it("is pending only during the bounded opening interval", () => {
    const storage = memoryStorage();
    const owner = beginProjectBootstrap(storage, 1_000, () => "ide-a");

    expect(owner).toBe("ide-a");
    expect(projectBootstrapExpiresAt(storage)).toBe(16_000);
    expect(projectBootstrapIsPending(storage, 15_999)).toBe(true);
    expect(projectBootstrapIsPending(storage, 16_000)).toBe(false);
  });

  it("lets only the current IDE owner finish the shared opening state", () => {
    const storage = memoryStorage();
    beginProjectBootstrap(storage, 1_000, () => "ide-a");
    beginProjectBootstrap(storage, 1_100, () => "ide-b");

    finishProjectBootstrap("ide-a", storage);
    expect(projectBootstrapIsPending(storage, 1_200)).toBe(true);
    finishProjectBootstrap("ide-b", storage);
    expect(storage.getItem(PROJECT_BOOTSTRAP_KEY)).toBeNull();
  });

  it("ignores malformed browser state", () => {
    const storage = memoryStorage();
    storage.setItem(PROJECT_BOOTSTRAP_KEY, "not-json");
    expect(projectBootstrapIsPending(storage, 1_000)).toBe(false);
  });
});
