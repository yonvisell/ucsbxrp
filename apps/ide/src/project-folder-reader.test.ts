import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CourseDirectoryHandle } from "../../shared/course-folder";
import { readProjectFolder, type FolderReadResult } from "./project-files";
import {
  pendingProjectCommit,
  ProjectCommitRecoveryError,
} from "./project-native-write";
import { inspectProjectWriters } from "./project-writer-admission";
import { readProjectFolderWhenIdle } from "./project-folder-reader";

vi.mock("./project-files", () => ({
  readProjectFolder: vi.fn(),
  projectMetadataFile: ".ucsb-xrp-project.json",
}));
vi.mock("./project-native-write", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./project-native-write")>()),
  pendingProjectCommit: vi.fn(),
}));
vi.mock("./project-writer-admission", () => ({
  inspectProjectWriters: vi.fn(),
}));

const metadataText = vi.fn<() => Promise<string>>();
const folder = {
  name: "Student Project",
  getFileHandle: async () => ({
    getFile: async () => ({ size: 64, text: metadataText }),
  }),
} as unknown as CourseDirectoryHandle;
const saved: FolderReadResult = {
  project: {
    name: "Saved",
    entrypoint: "main.py",
    files: { "main.py": "print(2)" },
  },
  contentDigest: "saved",
  skipped: 0,
  integrity: "verified",
};
const writer = {
  fileName: ".ucsb-xrp-writer-active.json",
  text: "",
  owner: "active",
  choosing: false,
  ticket: 1,
  createdAt: 0,
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(inspectProjectWriters).mockReset().mockResolvedValue([]);
  vi.mocked(readProjectFolder).mockReset().mockResolvedValue(saved);
  vi.mocked(pendingProjectCommit).mockReset().mockResolvedValue(null);
  metadataText.mockReset().mockResolvedValue("generation-1");
});
afterEach(() => vi.useRealTimers());

describe("Project reads during saves", () => {
  it("waits for a writer without reading its unfinished source", async () => {
    vi.mocked(inspectProjectWriters).mockResolvedValueOnce([writer]);
    const onWait = vi.fn();
    const result = readProjectFolderWhenIdle(folder, { onWait });
    await vi.advanceTimersByTimeAsync(50);
    expect(await result).toBe(saved);
    expect(readProjectFolder).toHaveBeenCalledTimes(1);
    expect(onWait).toHaveBeenCalledTimes(1);
  });

  it("discards a snapshot crossed by a new commit and reads again", async () => {
    vi.mocked(inspectProjectWriters)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([writer]);
    vi.mocked(readProjectFolder).mockResolvedValueOnce({
      ...saved,
      contentDigest: "crossed",
    });
    const result = readProjectFolderWhenIdle(folder);
    await vi.advanceTimersByTimeAsync(50);
    expect(await result).toBe(saved);
    expect(readProjectFolder).toHaveBeenCalledTimes(2);
  });

  it("retries a disappearing file but preserves persistent recovery errors", async () => {
    vi.mocked(readProjectFolder).mockRejectedValueOnce(
      new DOMException("File changed", "NotFoundError"),
    );
    const result = readProjectFolderWhenIdle(folder);
    await vi.advanceTimersByTimeAsync(50);
    expect(await result).toBe(saved);
    const recovery = new Error("A Project save did not finish");
    vi.mocked(readProjectFolder).mockRejectedValueOnce(recovery);
    await expect(readProjectFolderWhenIdle(folder)).rejects.toBe(recovery);
  });

  it("rejects mixed files when a complete save falls between both writer checks", async () => {
    metadataText
      .mockResolvedValueOnce("generation-1")
      .mockResolvedValue("generation-2");
    vi.mocked(readProjectFolder).mockResolvedValueOnce({
      ...saved,
      contentDigest: "mixed files",
      integrity: "changed-after-save",
    });
    const result = readProjectFolderWhenIdle(folder);
    await vi.advanceTimersByTimeAsync(50);
    expect(await result).toBe(saved);
    expect(readProjectFolder).toHaveBeenCalledTimes(2);
  });

  it("retries an observed commit that finishes but preserves an unchanged journal", async () => {
    const commit = {
      transactionId: "held-commit",
      createdAt: 0,
      previous: null,
      intended: saved.project,
      deletedPaths: [],
    };
    const interrupted = new ProjectCommitRecoveryError(commit);
    vi.mocked(readProjectFolder).mockRejectedValueOnce(interrupted);
    const result = readProjectFolderWhenIdle(folder);
    await vi.advanceTimersByTimeAsync(50);
    expect(await result).toBe(saved);
    vi.mocked(pendingProjectCommit).mockResolvedValue(commit);
    vi.mocked(readProjectFolder).mockRejectedValueOnce(interrupted);
    await expect(readProjectFolderWhenIdle(folder)).rejects.toBe(interrupted);
  });

  it("requires IDE review for a stable stored-digest mismatch", async () => {
    vi.mocked(readProjectFolder).mockResolvedValue({
      ...saved,
      integrity: "changed-after-save",
    });
    await expect(readProjectFolderWhenIdle(folder)).rejects.toThrow(
      "Open it in the IDE to review and save",
    );
    expect(readProjectFolder).toHaveBeenCalledTimes(1);
  });

  it("bounds a pending writer and rejects a superseded reader", async () => {
    vi.mocked(inspectProjectWriters).mockResolvedValue([writer]);
    const bounded = expect(
      readProjectFolderWhenIdle(folder, { timeoutMs: 100 }),
    ).rejects.toThrow("refresh the Project folder");
    await vi.advanceTimersByTimeAsync(100);
    await bounded;
    let current = true;
    const cancelled = expect(
      readProjectFolderWhenIdle(folder, {
        assertCurrent: () => {
          if (!current) throw new DOMException("Changed Project", "AbortError");
        },
      }),
    ).rejects.toMatchObject({ name: "AbortError" });
    await vi.advanceTimersByTimeAsync(1);
    current = false;
    await vi.advanceTimersByTimeAsync(50);
    await cancelled;
    expect(readProjectFolder).not.toHaveBeenCalled();
  });
});
