// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CourseDirectoryHandle } from "../../shared/course-folder";
import { RunArchiveNotice } from "./RunArchiveNotice";
import { RunArchiveRecorder } from "./run-archive-recorder";

const download = vi.hoisted(() => vi.fn());
vi.mock("../../dashboard/src/monitor-export-core", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("../../dashboard/src/monitor-export-core")
  >()),
  downloadBlob: download,
}));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let root: Root | undefined;
let container: HTMLDivElement;

afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
  download.mockReset();
});

async function failedRun(recorder: RunArchiveRecorder, runId: string) {
  const event = {
    type: "run" as const,
    runId,
    startedAtMs: 1000,
    projectId: "project-a",
    projectName: "Project A",
    projectRevision: "sha-a",
    entrypoint: "main.py",
  };
  recorder.receive(
    { ...event, phase: "begin", state: "running", detail: "Running" },
    "virtual",
  );
  recorder.receive(
    {
      ...event,
      phase: "end",
      finishedAtMs: 2000,
      state: "ready",
      detail: "Done",
    },
    "virtual",
  );
  await recorder.flush();
}

async function mount(recorder: RunArchiveRecorder) {
  container = document.createElement("div");
  root = createRoot(container);
  await act(async () =>
    root!.render(createElement(RunArchiveNotice, { recorder })),
  );
}

function button(label: string) {
  const found = [...container.querySelectorAll("button")].find(
    (element) => element.textContent === label,
  );
  if (!found) throw new Error(`Button missing: ${label}`);
  return found;
}

describe("run recovery download acknowledgment", () => {
  it("keeps a pending or canceled download protected and confirms only the attempted batch", async () => {
    const recorder = new RunArchiveRecorder(
      async () => ({ folder: { name: "Project A" } as CourseDirectoryHandle }),
      async () => {
        throw new Error("Disk unavailable");
      },
    );
    await failedRun(recorder, "run-a");
    await mount(recorder);
    expect(container.textContent).not.toContain("I saved the recovery file");
    await act(async () => button("Download unsaved run data").click());
    // The browser starts a download but exposes no completion/cancellation
    // callback to this page. Neither outcome may release the recovery copy.
    expect(download).toHaveBeenCalledTimes(1);
    expect(recorder.unsavedRuns().map((run) => run.id)).toEqual(["run-a"]);
    expect(recorder.canStartRun).toBe(false);
    expect(recorder.needsProtection).toBe(true);
    expect(await recorder.flush()).toBe(false);
    expect(recorder.snapshot().phase).toBe("error");
    expect(container.textContent).toContain("canceled or blocked");

    await act(async () => failedRun(recorder, "run-b"));
    expect(container.textContent).toContain("1 of the 2 unsaved runs");
    await act(async () => button("I saved the recovery file").click());
    expect(recorder.unsavedRuns().map((run) => run.id)).toEqual(["run-b"]);
    expect(recorder.needsProtection).toBe(true);
    expect(container.textContent).not.toContain("I saved the recovery file");

    await act(async () => button("Download unsaved run data").click());
    await act(async () => button("I saved the recovery file").click());
    expect(recorder.needsProtection).toBe(false);
    expect(recorder.canStartRun).toBe(true);
    expect(recorder.snapshot().phase).toBe("recovery-confirmed");
    expect(recorder.snapshot().detail).toContain(
      "not saved to its Project folder",
    );
  });

  it("requires a new confirmation for new failed data, while a successful retry reports a Project save", async () => {
    let canWrite = false;
    const recorder = new RunArchiveRecorder(
      async () => ({ folder: { name: "Project A" } as CourseDirectoryHandle }),
      async () => {
        if (!canWrite) throw new Error("Disk unavailable");
      },
    );
    await failedRun(recorder, "run-a");
    await mount(recorder);
    await act(async () => button("Download unsaved run data").click());
    await act(async () => button("I saved the recovery file").click());
    await act(async () => failedRun(recorder, "run-b"));
    expect(recorder.snapshot().phase).toBe("error");
    expect(container.textContent).not.toContain("I saved the recovery file");
    canWrite = true;
    await act(async () => {
      button("Retry run save").click();
      await recorder.flush();
    });
    expect(recorder.snapshot().phase).toBe("saved");
    expect(recorder.snapshot().detail).toBe("Run saved to Project A.");
    expect(recorder.needsProtection).toBe(false);
  });
});
