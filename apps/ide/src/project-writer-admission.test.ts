import { describe, expect, it, vi } from "vitest";
import type {
  CourseDirectoryHandle,
  CourseFileHandle,
} from "../../shared/course-folder";
import {
  acquireProjectWriter,
  inspectProjectWriters,
  releaseSelectedProjectWriters,
} from "./project-writer-admission";

class NativeFiles implements CourseDirectoryHandle {
  readonly kind = "directory" as const;
  readonly name = "Project";
  beforeClose?: (path: string, text: string) => Promise<void>;
  constructor(readonly files: Map<string, string>) {}
  async *entries(): AsyncIterableIterator<[string, CourseFileHandle]> {
    for (const name of [...this.files.keys()])
      yield [name, await this.getFileHandle(name)];
  }
  async getDirectoryHandle(): Promise<CourseDirectoryHandle> {
    throw new DOMException("Missing", "NotFoundError");
  }
  async removeEntry(name: string) {
    this.files.delete(name);
  }
  async getFileHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<CourseFileHandle> {
    if (!options?.create && !this.files.has(name))
      throw new DOMException("Missing", "NotFoundError");
    if (!this.files.has(name)) this.files.set(name, "");
    return {
      kind: "file",
      name,
      getFile: async () =>
        ({
          size: this.files.get(name)?.length ?? 0,
          text: async () => this.files.get(name) ?? "",
        }) as File,
      createWritable: async () => {
        let buffered = "";
        return {
          write: async (value) => {
            buffered = String(value);
          },
          close: async () => {
            await this.beforeClose?.(name, buffered);
            this.files.set(name, buffered);
          },
          abort: async () => undefined,
        };
      },
    };
  }
}

describe("independent browser writer tickets", () => {
  it("serializes a forced simultaneous same-ticket race without a shared JS or Web Lock", async () => {
    const disk = new Map<string, string>();
    const a = new NativeFiles(disk);
    const b = new NativeFiles(disk);
    const bothChoosing: Array<() => void> = [];
    const gate = async (_path: string, text: string) => {
      if (!text.includes('"choosing":false')) return;
      await new Promise<void>((resolve) => {
        bothChoosing.push(resolve);
        if (bothChoosing.length === 2)
          bothChoosing.forEach((release) => release());
      });
    };
    a.beforeClose = gate;
    b.beforeClose = gate;
    let active = 0;
    let maximumActive = 0;
    let releaseA!: () => void;
    const order: string[] = [];
    const first = (async () => {
      const admitted = await acquireProjectWriter(a, {
        ownerId: "a",
        pollMs: 1,
      });
      active++;
      maximumActive = Math.max(maximumActive, active);
      order.push("a");
      await new Promise<void>((resolve) => {
        releaseA = resolve;
      });
      await admitted.assertCurrent();
      active--;
      await admitted.release();
    })();
    const second = (async () => {
      const admitted = await acquireProjectWriter(b, {
        ownerId: "b",
        pollMs: 1,
      });
      active++;
      maximumActive = Math.max(maximumActive, active);
      order.push("b");
      await admitted.assertCurrent();
      active--;
      await admitted.release();
    })();
    await vi.waitFor(() => expect(releaseA).toBeTypeOf("function"));
    expect(order).toEqual(["a"]);
    releaseA();
    await Promise.all([first, second]);
    expect(order).toEqual(["a", "b"]);
    expect(maximumActive).toBe(1);
    expect(disk.size).toBe(0);
  });

  it("never treats an expired timestamp or incomplete choosing record as a departed writer", async () => {
    const disk = new Map<string, string>([
      [
        ".ucsb-xrp-writer-orphan.json",
        JSON.stringify({
          schemaVersion: 1,
          owner: "orphan",
          choosing: false,
          ticket: 1,
          createdAt: 1,
        }),
      ],
    ]);
    const root = new NativeFiles(disk);
    await expect(
      acquireProjectWriter(root, { ownerId: "new", waitLimitMs: 3, pollMs: 1 }),
    ).rejects.toThrow("old timestamp does not release");
    expect(disk.has(".ucsb-xrp-writer-new.json")).toBe(false);
    disk.set(".ucsb-xrp-writer-incomplete.json", "");
    await expect(
      acquireProjectWriter(root, { ownerId: "new", waitLimitMs: 3, pollMs: 1 }),
    ).rejects.toThrow("writer recovery");
    expect(disk.size).toBe(2);
  });

  it("cancels a paused writer's before-close fence after explicit recovery, while allowing a new writer", async () => {
    const root = new NativeFiles(new Map());
    const paused = await acquireProjectWriter(root, { ownerId: "paused" });
    const records = await inspectProjectWriters(root);
    await releaseSelectedProjectWriters(root, records);
    const next = await acquireProjectWriter(root, { ownerId: "next" });
    await expect(paused.assertCurrent()).rejects.toThrow(
      "cancelled or recovered",
    );
    await next.assertCurrent();
    await paused.release();
    expect(
      (await inspectProjectWriters(root)).map((record) => record.owner),
    ).toEqual(["next"]);
    await next.release();
  });

  it("refuses a stale recovery action after another participant starts", async () => {
    const root = new NativeFiles(new Map());
    const original = await acquireProjectWriter(root, { ownerId: "a" });
    const stale = await inspectProjectWriters(root);
    root.files.set(".ucsb-xrp-writer-b.json", "");
    await expect(releaseSelectedProjectWriters(root, stale)).rejects.toThrow(
      "records changed",
    );
    await original.assertCurrent();
    expect(root.files.has(stale[0]!.fileName)).toBe(true);
    await original.release();
  });
});
