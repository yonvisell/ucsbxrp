// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CourseDirectoryHandle } from "../../shared/course-folder";
import type { MonitorRunDataset } from "./monitor-run-dataset";
import type { SavedRunReadOptions, SavedRunSummary } from "./saved-run-reader";
import { SavedRunPicker } from "./SavedRunPicker";

const reader = vi.hoisted(() => ({ list: vi.fn(), open: vi.fn() }));
vi.mock("./saved-run-reader", () => ({
  listSavedRuns: reader.list,
  readSavedRun: reader.open,
}));

const folderA = { name: "Project" } as CourseDirectoryHandle;
const folderB = { name: "Project" } as CourseDirectoryHandle;
const summary = (runId: string): SavedRunSummary => ({
  runId,
  generation: 1,
  name: "Project",
  target: "virtual",
  startedAt: "2026-09-14T18:00:00.000Z",
  finishedAt: "2026-09-14T18:00:01.000Z",
  finalState: "ready",
  telemetrySamples: 12,
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
let host: HTMLDivElement;
let root: Root;
const onOpen = vi.fn();
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});
const render = (
  folder: CourseDirectoryHandle,
  projectId = "project-a",
  disabled = false,
) =>
  act(async () =>
    root.render(
      createElement(SavedRunPicker, { folder, projectId, disabled, onOpen }),
    ),
  );
const button = (label: string) =>
  [...host.querySelectorAll("button")].find(
    (element) => element.textContent === label,
  )!;
const click = (label: string) => act(async () => button(label).click());

describe("saved trial picker identity changes", () => {
  it("shows a waiting reader and cancels its original binding when the folder changes", async () => {
    const reading = deferred<SavedRunSummary[]>();
    reader.list
      .mockReturnValueOnce(reading.promise)
      .mockResolvedValueOnce([summary("new-run")]);
    await render(folderA);
    await click("Open saved run…");
    const options = reader.list.mock.calls[0]?.[2] as SavedRunReadOptions;
    await act(async () => options.onWait?.());
    expect(host.textContent).toContain("Waiting for Project to finish saving");
    options.assertCurrent?.();
    await render(folderB);
    expect(() => options.assertCurrent?.()).toThrow(
      "The run or Project changed",
    );
    await act(async () => reading.resolve([summary("old-run")]));
    expect(host.querySelector("select")).toBeNull();
    await click("Open saved run…");
    expect(host.querySelector("select")?.value).toBe("new-run");
  });
  it("releases a pending list after reconnecting the same Project with a new handle and ignores the old completion", async () => {
    const old = deferred<SavedRunSummary[]>();
    reader.list
      .mockReturnValueOnce(old.promise)
      .mockResolvedValueOnce([summary("new-run")]);
    await render(folderA);
    await click("Open saved run…");
    expect(button("Open saved run…").disabled).toBe(true);
    await render(folderB);
    expect(button("Open saved run…").disabled).toBe(false);
    await act(async () => old.resolve([summary("old-run")]));
    expect(host.querySelector("select")).toBeNull();
    expect(host.textContent).not.toContain("Reading saved runs");
    await click("Open saved run…");
    expect(host.querySelector("select")?.value).toBe("new-run");
    expect(reader.list).toHaveBeenLastCalledWith(
      folderB,
      "project-a",
      expect.objectContaining({
        assertCurrent: expect.any(Function),
        onWait: expect.any(Function),
      }),
    );
  });

  it("does not commit an old open operation after its Project identity changes", async () => {
    const old = deferred<MonitorRunDataset>();
    reader.list.mockResolvedValue([summary("old-run")]);
    reader.open.mockReturnValue(old.promise);
    await render(folderA);
    await click("Open saved run…");
    await click("Open trial");
    await render(folderA, "project-b");
    expect(button("Open saved run…").disabled).toBe(false);
    await act(async () => old.resolve({ id: "old-run" } as MonitorRunDataset));
    expect(onOpen).not.toHaveBeenCalled();
    expect(host.querySelector("select")).toBeNull();
  });

  it("keeps a delayed open from replacing the display after a new run starts", async () => {
    const old = deferred<MonitorRunDataset>();
    reader.list.mockResolvedValue([summary("old-run")]);
    reader.open.mockReturnValue(old.promise);
    await render(folderA);
    await click("Open saved run…");
    await click("Open trial");
    await render(folderA, "project-a", true);
    await act(async () => old.resolve({ id: "old-run" } as MonitorRunDataset));
    expect(onOpen).not.toHaveBeenCalled();
    expect(host.textContent).toContain("The run or Project changed");
    expect(button("Cancel").disabled).toBe(false);
  });

  it("keeps a short intervening run from reactivating an older pending open", async () => {
    const old = deferred<MonitorRunDataset>();
    reader.list.mockResolvedValue([summary("old-run")]);
    reader.open.mockReturnValue(old.promise);
    await render(folderA);
    await click("Open saved run…");
    await click("Open trial");
    await render(folderA, "project-a", true);
    await render(folderA, "project-a", false);
    await act(async () => old.resolve({ id: "old-run" } as MonitorRunDataset));
    expect(onOpen).not.toHaveBeenCalled();
    expect(host.textContent).toContain("The run or Project changed");
    expect(button("Open trial").disabled).toBe(false);
  });
});
