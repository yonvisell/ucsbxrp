import { describe, expect, it } from "vitest";

import {
  compilationIsFresh,
  forgetCompilation,
  rememberCompilation,
} from "./compilation-freshness";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("compilation freshness", () => {
  const digestA = "a".repeat(64);
  const digestB = "b".repeat(64);

  it("retains only an exact compiled content digest for one browser tab", () => {
    const storage = memoryStorage();
    rememberCompilation(storage, digestA);

    expect(compilationIsFresh(storage, digestA)).toBe(true);
    expect(compilationIsFresh(storage, digestB)).toBe(false);
  });

  it("forgets a failed or superseded compilation", () => {
    const storage = memoryStorage();
    rememberCompilation(storage, digestA);
    forgetCompilation(storage);

    expect(compilationIsFresh(storage, digestA)).toBe(false);
  });

  it("treats malformed browser state as not compiled", () => {
    const storage = memoryStorage();
    storage.setItem("ucsb-xrp-ide-compiled-digest-v1", "not-a-digest");

    expect(compilationIsFresh(storage, digestA)).toBe(false);
  });
});
