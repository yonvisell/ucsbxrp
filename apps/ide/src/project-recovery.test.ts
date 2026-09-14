import { describe, expect, it } from "vitest";
import { ProjectRecoveryStore } from "./project-recovery";
import {
  createProjectSession,
  markProjectSessionSaved,
  updateProjectSession,
} from "./project-session";

class MemoryStorage implements Storage {
  values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
}
const location = { workspaceName: "Class", folderName: "Project" };
function dirty(id: string, text: string) {
  const clean = createProjectSession(
    { name: "Project", entrypoint: "main.py", files: { "main.py": "old" } },
    { source: "folder", projectId: id, baseDigest: "a".repeat(64) },
  );
  return updateProjectSession(clean, {
    ...clean.project,
    files: { "main.py": text },
  });
}

describe("exceptional Project recovery", () => {
  it("recovers exact bytes and disk base after a new page opens the store", () => {
    const storage = new MemoryStorage();
    const original = dirty("project-a", "print('recover')\n# café\n");
    new ProjectRecoveryStore(storage, "old-tab").retain(original, location);
    const restored = new ProjectRecoveryStore(storage, "new-tab").list();
    expect(restored).toHaveLength(1);
    expect(restored[0]?.snapshot.files).toEqual(original.project.files);
    expect(restored[0]?.snapshot.session?.baseDigest).toBe("a".repeat(64));
  });
  it("retains distinct projects and competing tab copies without overwrite", () => {
    const storage = new MemoryStorage();
    const first = new ProjectRecoveryStore(storage, "tab-a");
    const second = new ProjectRecoveryStore(storage, "tab-b");
    first.retain(dirty("project-a", "one"), location);
    first.retain(dirty("project-b", "two"), location);
    second.retain(dirty("project-a", "three"), location);
    expect(
      first
        .list()
        .map((record) => record.snapshot.files["main.py"])
        .sort(),
    ).toEqual(["one", "three", "two"]);
  });
  it("does not clear a newer edit when an older save finishes", () => {
    const store = new ProjectRecoveryStore(new MemoryStorage(), "tab");
    const one = dirty("a", "one");
    store.retain(one, location);
    const two = updateProjectSession(one, {
      ...one.project,
      files: { "main.py": "two" },
    });
    store.retain(two, location);
    store.acknowledge(markProjectSessionSaved(one));
    expect(store.list()[0]?.snapshot.files["main.py"]).toBe("two");
    store.acknowledge(markProjectSessionSaved(two));
    expect(store.list()).toEqual([]);
  });
  it("does not discard a later copy through a stale recovery button", () => {
    const store = new ProjectRecoveryStore(new MemoryStorage(), "tab");
    const one = dirty("a", "one");
    store.retain(one, location);
    const stale = store.list()[0]!;
    store.retain(
      updateProjectSession(one, {
        ...one.project,
        files: { "main.py": "two" },
      }),
      location,
    );
    store.discard(stale);
    expect(store.list()[0]?.snapshot.files["main.py"]).toBe("two");
  });
  it("reports storage failure and retains earlier copies at its capacity boundary", () => {
    const storage = new MemoryStorage();
    const store = new ProjectRecoveryStore(storage, "tab");
    store.retain(dirty("a", "kept"), location);
    expect(() =>
      store.retain(dirty("b", "x".repeat(2_000_000)), location),
    ).toThrow("full");
    expect(store.list()[0]?.snapshot.files["main.py"]).toBe("kept");
    storage.setItem = () => {
      throw new DOMException("Denied", "QuotaExceededError");
    };
    expect(() => store.retain(dirty("a", "new"), location)).toThrow("Denied");
    expect(store.list()[0]?.snapshot.files["main.py"]).toBe("kept");
  });
});
