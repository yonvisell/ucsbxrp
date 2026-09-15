// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_WORLD_CATALOG,
  type TargetEvent,
  type TelemetrySample,
} from "@ucsb-xrp/target";
import type { MonitorRunDataset } from "./monitor-run-dataset";
import type { SignalPlotDefinition } from "./SignalPlot";
import { DashboardApp } from "./DashboardApp";

const boundary = vi.hoisted(() => ({
  folder: { name: "Project" },
  project: {
    projectId: "project-a",
    name: "Project",
    revision: "revision-a",
    entrypoint: "main.py",
    stale: false,
  },
  listeners: new Set<(event: TargetEvent) => void>(),
  readSavedRun: vi.fn(),
  readProject: vi.fn(),
  loadBinding: vi.fn(),
  permission: vi.fn(),
  archive: vi.fn(),
  saveNotes: vi.fn(),
  readNotes: vi.fn(),
  generation: vi.fn(),
  readText: vi.fn(),
  write: vi.fn(),
  download: vi.fn(),
  stop: vi.fn(),
  run: vi.fn(),
}));
vi.mock("@ucsb-xrp/target", async (original) => {
  const actual = await original<typeof import("@ucsb-xrp/target")>();
  return {
    ...actual,
    describeProject: async () => boundary.project,
    VirtualTargetClient: class {
      kind = "virtual";
      subscribe(listener: (event: TargetEvent) => void) {
        boundary.listeners.add(listener);
        return () => boundary.listeners.delete(listener);
      }
      async connect() {
        for (const listener of boundary.listeners)
          listener({ type: "status", state: "ready", detail: "Connected" });
      }
      disconnect() {}
      run = boundary.run;
      async stop() {
        boundary.stop();
        for (const listener of boundary.listeners)
          listener({ type: "status", state: "ready", detail: "Stopped" });
      }
    },
  };
});
vi.mock("../../shared/use-target-preference", () => ({
  useTargetPreference: () => [{ kind: "virtual" }, vi.fn(), true, null],
}));
vi.mock("../../shared/course-folder", async (original) => ({
  ...(await original<typeof import("../../shared/course-folder")>()),
  courseFolderPermission: boundary.permission,
  loadRememberedWorkspaceFolder: async () => boundary.folder,
  loadRememberedProjectFolder: async () => boundary.folder,
  subscribeCourseFolderChanged: () => () => {},
  withCourseFolderWriteLock: async (_kind: string, operation: () => unknown) =>
    operation(),
  writeCourseFile: boundary.write,
  readCourseTextFile: boundary.readText,
}));
vi.mock("../../shared/project-binding", () => ({
  loadProjectBinding: boundary.loadBinding,
  rememberProjectBinding: async () => {},
  resolveProjectFolderById: async () => boundary.folder,
}));
vi.mock("../../ide/src/project-folder-reader", () => ({
  readProjectFolderWhenIdle: boundary.readProject,
}));
vi.mock("../../shared/diagnostic-log", () => ({
  DiagnosticLogWriter: class {
    record() {}
    attachWorkingFolder() {}
    detachWorkingFolder() {}
    async flush() {}
  },
}));
vi.mock("./monitor-run-archive", () => ({
  saveRunArchive: boundary.archive,
  readRunAnnotations: boundary.readNotes,
  saveRunAnnotations: boundary.saveNotes,
  findRunGeneration: boundary.generation,
}));
vi.mock("./monitor-export-core", async (original) => ({
  ...(await original<typeof import("./monitor-export-core")>()),
  downloadBlob: boundary.download,
  webmExportSupported: () => true,
}));
vi.mock("./monitor-export", () => ({
  createSignalPlotsSvg: () => "<svg></svg>",
  svgToPng: async () => new Blob(["png"], { type: "image/png" }),
  createWorldReplayWebm: async () => new Blob(["webm"], { type: "video/webm" }),
}));
vi.mock("./saved-run-reader", () => ({
  listSavedRuns: async () => [
    {
      runId: "saved-a",
      generation: 1,
      name: "Project",
      target: "virtual",
      startedAt: "2026-09-14T18:00:00.000Z",
      finishedAt: "2026-09-14T18:00:01.000Z",
      finalState: "ready",
      telemetrySamples: 1,
    },
  ],
  readSavedRun: boundary.readSavedRun,
}));
vi.mock("./WorldView", () => ({
  WorldView: (props: {
    sample: TelemetrySample | null;
    samples: readonly TelemetrySample[];
    annotations: readonly unknown[];
  }) =>
    createElement("div", {
      "data-testid": "world-view",
      "data-x": props.sample?.xMm,
      "data-history": props.samples.length,
      "data-notes": props.annotations.length,
    }),
}));
vi.mock("./SignalPlot", async (original) => ({
  ...(await original<typeof import("./SignalPlot")>()),
  SignalPlot: (props: {
    definition: SignalPlotDefinition;
    samples: readonly TelemetrySample[];
  }) =>
    createElement(
      "div",
      { "data-test-plot": props.definition.id },
      JSON.stringify(
        props.samples.map((row) =>
          props.definition.series.map((series) => series.value(row)),
        ),
      ),
    ),
}));

const sample = (seq: number, xMm: number): TelemetrySample => ({
  source: "virtual",
  seq,
  observationSeq: seq,
  tMs: seq * 20,
  poseAvailable: true,
  xMm,
  yMm: 0,
  headingRad: 0,
  leftEffort: 0,
  rightEffort: 0,
  leftWheelSpeedMmS: 0,
  rightWheelSpeedMmS: 0,
  leftEncoderCount: 0,
  rightEncoderCount: 0,
  collision: false,
  rangeMm: null,
  buttonPressed: false,
  accelerationMg: null,
  angularRateMdps: null,
  temperatureC: null,
  batteryV: null,
  sensorError: null,
});

let host: HTMLDivElement;
let root: Root;
let saved: MonitorRunDataset;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("showSaveFilePicker", undefined);
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(min-width: 901px)",
    addEventListener() {},
    removeEventListener() {},
  }));
  boundary.loadBinding.mockResolvedValue({ folder: boundary.folder });
  boundary.permission.mockResolvedValue("granted");
  boundary.archive.mockResolvedValue({});
  boundary.saveNotes.mockResolvedValue(1);
  boundary.readNotes.mockResolvedValue([]);
  boundary.readProject.mockResolvedValue({
    project: { session: { projectId: "project-a" } },
  });
  boundary.generation.mockResolvedValue(1);
  boundary.readText.mockResolvedValue(null);
  boundary.write.mockResolvedValue(undefined);
  boundary.run.mockResolvedValue(undefined);
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value() {
      this.setAttribute("open", "");
    },
  });
  saved = {
    id: "saved-a",
    target: "virtual",
    project: boundary.project,
    worldId: DEFAULT_WORLD_CATALOG.defaultWorldId,
    world: DEFAULT_WORLD_CATALOG.worlds[0]!,
    startedAt: "2026-09-14T18:00:00.000Z",
    finishedAt: "2026-09-14T18:00:01.000Z",
    finalState: "ready",
    finalDetail: "Stopped",
    recording: {
      schemaVersion: 3,
      samples: [sample(1, 100)],
      droppedSamples: 0,
    },
    output: [],
    droppedOutputLines: 0,
    annotations: [
      {
        id: "note-a",
        label: "Saved observation",
        source: "virtual",
        seq: 1,
        observationSeq: 1,
        tMs: 20,
        poseAvailable: true,
        xMm: 100,
        yMm: 0,
      },
    ],
  };
  boundary.readSavedRun.mockImplementation(
    async (_folder, _project, runId) => ({
      ...saved,
      id: runId,
    }),
  );
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  boundary.listeners.clear();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
const emit = async (...events: TargetEvent[]) =>
  act(async () => {
    for (const event of events)
      for (const listener of boundary.listeners) listener(event);
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });
const click = async (label: string) =>
  act(async () => {
    const button = [...host.querySelectorAll("button")].find(
      (item) => item.textContent === label,
    );
    expect(button?.disabled).toBe(false);
    button!.click();
  });

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

const protectedFromUnload = () => {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
};
async function typeNote(label: string) {
  await act(async () => {
    const input = host.querySelector("textarea")!;
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )!.set!.call(input, label);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
const readBlob = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
const liveRun = (
  runId = "run-a",
  projectId = "project-a",
): Extract<TargetEvent, { type: "run" }> => ({
  type: "run",
  phase: "begin",
  runId,
  projectId,
  projectName: projectId === "project-a" ? "Project" : "Other",
  projectRevision: "revision-a",
  entrypoint: "main.py",
  startedAtMs: 1000,
  state: "running",
  detail: "Started",
});

async function startAnnotatedRun() {
  const run = liveRun();
  await emit(
    run,
    { type: "telemetry", sample: sample(1, 100) },
    { type: "telemetry", sample: sample(2, 200) },
  );
  await click("Add note");
  await typeNote("Initial observation");
  await click("Add");
  await emit({ ...run, phase: "end", state: "ready", finishedAtMs: 2000 });
  return run;
}

async function editInitialNote(label: string) {
  await act(async () =>
    host.querySelector<HTMLButtonElement>(".monitor-note-list button")!.click(),
  );
  await typeNote(label);
  await click("Save note");
}

describe("cancelled departure during Run preparation", () => {
  it("invalidates a held Project read while retaining the warning and allowing an explicit retry", async () => {
    await act(async () => root.render(createElement(DashboardApp)));
    const opening = deferred<unknown>();
    boundary.readProject.mockImplementationOnce(() => opening.promise);
    await click("Run");
    expect(boundary.run).not.toHaveBeenCalled();
    await act(async () => {
      expect(protectedFromUnload()).toBe(true);
    });
    expect(
      host.querySelector<HTMLButtonElement>('[aria-label="Run"]')?.disabled,
    ).toBe(false);
    await act(async () =>
      opening.resolve({ project: { session: { projectId: "project-a" } } }),
    );
    expect(boundary.run).not.toHaveBeenCalled();
    expect(protectedFromUnload()).toBe(false);
    expect(
      host.querySelector('[data-testid="recording-count"]')?.textContent,
    ).toBe("Run a program to collect data.");
    await click("Run");
    expect(boundary.run).toHaveBeenCalledTimes(1);
  });
});

describe("retained archive recovery", () => {
  it("retains the full failed run and newer notes across Clear and a peer Run, then retries only its original destination", async () => {
    await act(async () => root.render(createElement(DashboardApp)));
    const initial = deferred<unknown>();
    boundary.archive.mockImplementationOnce(() => initial.promise);
    boundary.saveNotes.mockRejectedValueOnce(new Error("Notes writer busy"));
    await startAnnotatedRun();
    expect(
      host.querySelector<HTMLButtonElement>('[aria-label="Run"]')?.disabled,
    ).toBe(true);
    expect(host.textContent).toContain(
      "Saving completed run to its Project folder",
    );
    await editInitialNote("Newer observation");
    expect(protectedFromUnload()).toBe(true);
    await act(async () => initial.reject(new Error("Another page is saving")));
    expect(host.textContent).toContain("Unsaved run: Project");
    expect(host.textContent).toContain("Unsaved notes: Project");
    expect(protectedFromUnload()).toBe(true);
    const repeated: Extract<TargetEvent, { type: "run-history" }> = {
      ...liveRun(),
      type: "run-history",
      finishedAtMs: 2000,
      state: "ready",
      retainedTelemetryDropped: 10,
    };
    await emit(
      repeated,
      { type: "telemetry", replayed: true, sample: sample(20, 999) },
      { ...repeated, phase: "end" },
    );
    expect(host.querySelector(".monitor-note-list")?.textContent).toContain(
      "Newer observation",
    );
    expect(
      host.querySelector('[data-testid="recording-count"]')?.textContent,
    ).toContain("2 samples");
    await click("Clear run");
    expect(protectedFromUnload()).toBe(true);
    await click("Download retained run");
    const recovery = JSON.parse(
      await readBlob(boundary.download.mock.calls[0]![0]),
    );
    expect(recovery.runs[0].runId).toBe("run-a");
    expect(recovery.runs[0].telemetry).toContain("Newer observation");
    expect(JSON.parse(recovery.runs[0].metadata).telemetrySamples).toBe(2);
    expect(protectedFromUnload()).toBe(true);
    const otherFolder = { name: "Other" };
    boundary.loadBinding.mockResolvedValue({ folder: otherFolder });
    const other = liveRun("run-b", "project-b");
    await emit(
      {
        type: "project",
        project: { ...boundary.project, name: "Other", projectId: "project-b" },
      },
      other,
      { type: "telemetry", sample: sample(1, 350) },
    );
    await click("Retry run save");
    const retry = boundary.archive.mock.calls[1]!;
    expect(retry[0]).toBe(boundary.folder);
    expect(retry[1].runId).toBe("run-a");
    expect(retry[1].telemetry).toContain("Newer observation");
    expect(
      boundary.loadBinding.mock.calls.filter(([id]) => id === "project-a"),
    ).toHaveLength(1);
    expect(host.textContent).not.toContain("Unsaved run:");
    expect(host.textContent).not.toContain("Unsaved notes:");
    expect(
      host.querySelector('[data-testid="world-view"]')?.getAttribute("data-x"),
    ).toBe("350");
    expect(protectedFromUnload()).toBe(true);
    await emit(
      { ...other, phase: "end", state: "ready", finishedAtMs: 3000 },
      { type: "status", state: "ready", detail: "Stopped" },
    );
    expect(protectedFromUnload()).toBe(false);
  });

  it("does not let an older initial-save completion acknowledge a newer failed note update", async () => {
    await act(async () => root.render(createElement(DashboardApp)));
    const initial = deferred<unknown>();
    boundary.archive.mockImplementationOnce(() => initial.promise);
    boundary.saveNotes
      .mockResolvedValueOnce(1)
      .mockRejectedValueOnce(new Error("Newer note save failed"));
    await startAnnotatedRun();
    await editInitialNote("Newer pending note");
    await act(async () => initial.resolve({}));
    expect(host.textContent).not.toContain("Unsaved run:");
    expect(host.textContent).toContain("Unsaved notes: Project");
    expect(host.querySelector(".monitor-note-list")?.textContent).toContain(
      "Newer pending note",
    );
    expect(protectedFromUnload()).toBe(true);
    await click("Clear run");
    expect(protectedFromUnload()).toBe(true);
    await click("Download retained notes");
    const recovery = JSON.parse(
      await readBlob(boundary.download.mock.calls[0]![0]),
    );
    expect(recovery.annotations[0].label).toBe("Newer pending note");
  });

  it("keeps a newer displayed note when an older archive retry completes", async () => {
    await act(async () => root.render(createElement(DashboardApp)));
    boundary.archive.mockRejectedValueOnce(new Error("Writer busy"));
    await startAnnotatedRun();
    const retry = deferred<unknown>();
    boundary.archive.mockImplementationOnce(() => retry.promise);
    boundary.saveNotes
      .mockResolvedValueOnce(1)
      .mockRejectedValueOnce(new Error("New note could not be saved"));
    await click("Retry run save");
    await editInitialNote("Edited during retry");
    await act(async () => retry.resolve({}));
    expect(host.querySelector(".monitor-note-list")?.textContent).toContain(
      "Edited during retry",
    );
    expect(host.textContent).toContain("Unsaved notes: Project");
    expect(host.textContent).not.toContain("Unsaved run:");
    expect(protectedFromUnload()).toBe(true);
    await click("Download retained notes");
    const recovered = JSON.parse(
      await readBlob(boundary.download.mock.calls[0]![0]),
    );
    expect(recovered.annotations[0].label).toBe("Edited during retry");
  });

  it("explains a pending or failed save with Controls collapsed and opens the retained run recovery", async () => {
    await act(async () => root.render(createElement(DashboardApp)));
    const archive = deferred<unknown>();
    boundary.archive.mockImplementationOnce(() => archive.promise);
    await startAnnotatedRun();
    await act(async () =>
      host
        .querySelector<HTMLButtonElement>(
          '[aria-label="Collapse monitor controls"]',
        )!
        .click(),
    );
    expect(host.querySelector('[aria-label="Monitor controls"]')).toBeNull();
    expect(host.querySelector(".monitor-notices")?.textContent).toContain(
      "Saving or verifying 1 retained run",
    );
    expect(
      host.querySelector<HTMLButtonElement>('[aria-label="Run"]')?.disabled,
    ).toBe(true);
    await act(async () =>
      archive.reject(new Error("Project writer timed out")),
    );
    expect(host.querySelector(".monitor-notices")?.textContent).toContain(
      "1 retained run needs recovery",
    );
    await click("Review run data");
    expect(
      host.querySelector('[aria-label="Monitor controls"]'),
    ).not.toBeNull();
    expect(host.textContent).toContain("Project writer timed out");
    expect(protectedFromUnload()).toBe(true);
  });

  it("retains a new local note when delayed disk verification reads an older completed replay", async () => {
    await act(async () => root.render(createElement(DashboardApp)));
    const reading = deferred<MonitorRunDataset>();
    boundary.readSavedRun.mockImplementationOnce(() => reading.promise);
    boundary.saveNotes.mockRejectedValueOnce(
      new Error("Local note could not be saved"),
    );
    const replay: Extract<TargetEvent, { type: "run-history" }> = {
      ...liveRun("late-note-run"),
      type: "run-history",
      state: "ready",
      finishedAtMs: 2000,
    };
    await emit(
      replay,
      { type: "telemetry", sample: sample(1, 200), replayed: true },
      { ...replay, phase: "end" },
    );
    await click("Add note");
    await typeNote("Local note during verification");
    await click("Add");
    await act(async () =>
      reading.resolve({ ...saved, id: "late-note-run", annotations: [] }),
    );
    expect(host.querySelector(".monitor-note-list")?.textContent).toContain(
      "Local note during verification",
    );
    expect(host.textContent).toContain("Unsaved notes: Project");
    expect(
      host.querySelector('[data-testid="run-autosave-status"]')?.textContent,
    ).toBe("Local note could not be saved");
    expect(protectedFromUnload()).toBe(true);
    await click("Clear run");
    await click("Download retained notes");
    const recovered = JSON.parse(
      await readBlob(boundary.download.mock.calls[0]![0]),
    );
    expect(recovered.runId).toBe("late-note-run");
    expect(recovered.annotations[0].label).toBe(
      "Local note during verification",
    );
    expect(protectedFromUnload()).toBe(true);
  });

  it("preserves replay read progress and failure while an older folder refresh settles", async () => {
    const folderRead = deferred<{
      project: { session: { projectId: string } };
    }>();
    boundary.readProject.mockImplementationOnce(() => folderRead.promise);
    const reading = deferred<MonitorRunDataset>();
    boundary.readSavedRun.mockImplementationOnce(() => reading.promise);
    await act(async () => root.render(createElement(DashboardApp)));
    const replay: Extract<TargetEvent, { type: "run-history" }> = {
      ...liveRun("waiting-for-note-commit"),
      type: "run-history",
      state: "ready",
      finishedAtMs: 2000,
    };
    await emit(
      replay,
      { type: "telemetry", sample: sample(1, 200), replayed: true },
      { ...replay, phase: "end" },
    );
    const options = boundary.readSavedRun.mock.calls[0]?.[3];
    await act(async () => options.onWait());
    const status = () =>
      host.querySelector('[data-testid="run-autosave-status"]')?.textContent;
    expect(status()).toContain("finish saving before reading this run");
    await act(async () => boundary.readProject.mock.calls[0]?.[1].onWait());
    expect(status()).toContain("finish saving before reading this run");
    await act(async () =>
      reading.reject(new Error("Saved run read timed out")),
    );
    expect(status()).toContain("Saved run read timed out");
    await act(async () =>
      folderRead.resolve({ project: { session: { projectId: "project-a" } } }),
    );
    expect(status()).toContain("Saved run read timed out");
    expect(host.textContent).toContain("Unsaved run: Project");
    expect(protectedFromUnload()).toBe(true);
  });

  it("retains full replay recovery if merging committed and local notes exceeds the note limit", async () => {
    await act(async () => root.render(createElement(DashboardApp)));
    const reading = deferred<MonitorRunDataset>();
    boundary.readSavedRun.mockImplementationOnce(() => reading.promise);
    boundary.saveNotes.mockRejectedValueOnce(new Error("Local note pending"));
    const replay: Extract<TargetEvent, { type: "run-history" }> = {
      ...liveRun("full-note-limit"),
      type: "run-history",
      state: "ready",
      finishedAtMs: 2000,
    };
    await emit(
      replay,
      { type: "telemetry", sample: sample(1, 200), replayed: true },
      { ...replay, phase: "end" },
    );
    await click("Add note");
    await typeNote("Keep this local observation");
    await click("Add");
    await act(async () =>
      reading.resolve({
        ...saved,
        id: "full-note-limit",
        annotations: Array.from({ length: 1024 }, (_, index) => ({
          ...saved.annotations[0]!,
          id: `disk-note-${index}`,
        })),
      }),
    );
    expect(host.textContent).toContain(
      "combined notes exceed this run's limit",
    );
    expect(host.textContent).toContain("Unsaved run: Project");
    expect(host.querySelector(".monitor-note-list")?.textContent).toContain(
      "Keep this local observation",
    );
    await click("Clear run");
    await click("Download retained run");
    const recovered = JSON.parse(
      await readBlob(boundary.download.mock.calls[0]![0]),
    );
    expect(recovered.runs[0].runId).toBe("full-note-limit");
    expect(JSON.parse(recovered.runs[0].metadata).telemetrySamples).toBe(1);
    expect(recovered.runs[0].telemetry).toContain(
      "Keep this local observation",
    );
    expect(protectedFromUnload()).toBe(true);
  });

  it("bounds recovery at four runs without eviction, keeps declined runs unrecorded through reconnect, and admits the next run after recovery", async () => {
    await act(async () => root.render(createElement(DashboardApp)));
    boundary.archive.mockRejectedValue(new Error("Archive writer unavailable"));
    for (let index = 1; index <= 4; index += 1) {
      const run = liveRun(`retained-${index}`);
      await emit(
        run,
        { type: "telemetry", sample: sample(index, index * 100) },
        { ...run, phase: "end", state: "ready", finishedAtMs: 2000 + index },
      );
    }
    const buttons = (label: string) =>
      [...host.querySelectorAll<HTMLButtonElement>("button")].filter(
        (button) => button.textContent === label,
      );
    expect(buttons("Download retained run")).toHaveLength(4);
    expect(
      host.querySelector<HTMLButtonElement>('[aria-label="Run"]')?.disabled,
    ).toBe(true);
    const same: Extract<TargetEvent, { type: "run-history" }> = {
      ...liveRun("retained-4"),
      type: "run-history",
      state: "ready",
      finishedAtMs: 2004,
    };
    await emit(
      same,
      { type: "telemetry", replayed: true, sample: sample(99, 999) },
      { ...same, phase: "end" },
    );
    expect(host.textContent).not.toContain(
      "This received run was not recorded",
    );
    expect(
      host.querySelector('[data-testid="recording-count"]')?.textContent,
    ).toContain("1 samples");
    for (const button of buttons("Download retained run"))
      await act(async () => button.click());
    const recovered = await Promise.all(
      boundary.download.mock.calls.map(async ([blob]) =>
        JSON.parse(await readBlob(blob)),
      ),
    );
    expect(recovered.map((item) => item.runs[0].runId)).toEqual([
      "retained-1",
      "retained-2",
      "retained-3",
      "retained-4",
    ]);
    expect(
      recovered.map(
        (item) => JSON.parse(item.runs[0].metadata).telemetrySamples,
      ),
    ).toEqual([1, 1, 1, 1]);
    const declined = liveRun("declined-5");
    await emit(
      declined,
      { type: "status", state: "running", detail: "Peer Run" },
      { type: "telemetry", sample: sample(1, 500) },
    );
    expect(host.textContent).toContain("This run is not being recorded");
    expect(
      host.querySelector<HTMLButtonElement>('[aria-label="Stop"]')?.disabled,
    ).toBe(false);
    expect(boundary.archive).toHaveBeenCalledTimes(4);
    await click("Discard retained run");
    expect(document.activeElement?.textContent).toBe("Keep recovery");
    expect(host.textContent).toContain("retained-1");
    await click("Keep recovery");
    expect(buttons("Download retained run")).toHaveLength(4);
    expect(protectedFromUnload()).toBe(true);
    await click("Discard retained run");
    await click("Discard this run");
    expect(buttons("Download retained run")).toHaveLength(3);
    const history: Extract<TargetEvent, { type: "run-history" }> = {
      ...declined,
      type: "run-history",
    };
    await emit(
      { type: "status", state: "error", detail: "Wi-Fi interrupted" },
      { type: "status", state: "disconnected", detail: "Reconnecting" },
      history,
      {
        type: "status",
        state: "running",
        detail: "Same program still running",
      },
      { type: "telemetry", replayed: true, sample: sample(20, 700) },
      { ...history, phase: "end" },
      { type: "telemetry", sample: sample(21, 710) },
    );
    expect(host.textContent).toContain("This run is not being recorded");
    expect(
      host.querySelector('[data-testid="recording-count"]')?.textContent,
    ).toContain("1 samples");
    expect(host.querySelector('[data-testid="x-mm"]')?.textContent).toBe(
      "710.0 mm",
    );
    expect(boundary.archive).toHaveBeenCalledTimes(4);
    await click("Clear run");
    for (let index = 0; index < 3; index += 1) {
      await click("Discard retained run");
      await click("Discard this run");
    }
    expect(buttons("Download retained run")).toHaveLength(0);
    expect(protectedFromUnload()).toBe(true);
    await act(async () =>
      host.querySelector<HTMLButtonElement>('[aria-label="Stop"]')!.click(),
    );
    expect(boundary.stop).toHaveBeenCalledOnce();
    expect(protectedFromUnload()).toBe(false);
    expect(
      host.querySelector<HTMLButtonElement>('[aria-label="Run"]')?.disabled,
    ).toBe(false);
    boundary.archive.mockResolvedValue({});
    const next = liveRun("next-6");
    await emit(
      next,
      { type: "telemetry", sample: sample(1, 50) },
      { ...next, phase: "end", state: "ready", finishedAtMs: 3000 },
    );
    expect(host.textContent).not.toContain("This run is not being recorded");
    expect(boundary.archive.mock.calls.at(-1)?.[1].runId).toBe("next-6");
    expect(
      JSON.parse(boundary.archive.mock.calls.at(-1)?.[1].metadata)
        .telemetrySamples,
    ).toBe(1);
  });

  it.each([false, true])(
    "settles validated replay archive reading after Clear (valid archive: %s)",
    async (validArchive) => {
      await act(async () => root.render(createElement(DashboardApp)));
      const destination = deferred<{ folder: typeof boundary.folder }>();
      boundary.loadBinding.mockReturnValue(destination.promise);
      if (!validArchive)
        boundary.readSavedRun.mockRejectedValueOnce(
          new Error("Saved telemetry file is missing"),
        );
      const replay: Extract<TargetEvent, { type: "run-history" }> = {
        ...liveRun("replayed-run"),
        type: "run-history",
        finishedAtMs: 2000,
        state: "ready",
        retainedTelemetryDropped: 5,
      };
      await emit(
        replay,
        { type: "telemetry", sample: sample(6, 200), replayed: true },
        { ...replay, phase: "end" },
      );
      expect(protectedFromUnload()).toBe(true);
      await click("Clear run");
      await act(async () => destination.resolve({ folder: boundary.folder }));
      expect(boundary.archive).not.toHaveBeenCalled();
      expect(boundary.readSavedRun).toHaveBeenCalledExactlyOnceWith(
        boundary.folder,
        "project-a",
        "replayed-run",
        expect.objectContaining({
          assertCurrent: expect.any(Function),
          onWait: expect.any(Function),
        }),
      );
      if (!validArchive) {
        expect(host.textContent).toContain("Saved telemetry file is missing");
        expect(protectedFromUnload()).toBe(true);
        await click("Download retained run");
        const recovery = JSON.parse(
          await readBlob(boundary.download.mock.calls[0]![0]),
        );
        expect(recovery.runs[0].runId).toBe("replayed-run");
        expect(JSON.parse(recovery.runs[0].metadata)).toMatchObject({
          telemetrySamples: 1,
          droppedTelemetrySamples: 5,
        });
        await click("Retry run save");
        expect(boundary.archive.mock.calls[0]?.[1].runId).toBe("replayed-run");
      }
      expect(protectedFromUnload()).toBe(false);
    },
  );
});

async function finishRunForExport() {
  const run: Extract<TargetEvent, { type: "run" }> = {
    type: "run",
    phase: "begin",
    runId: "export-run",
    projectId: boundary.project.projectId,
    projectName: boundary.project.name,
    projectRevision: boundary.project.revision,
    entrypoint: boundary.project.entrypoint,
    startedAtMs: 1000,
    state: "running",
    detail: "Run started",
  };
  await emit(
    run,
    { type: "telemetry", sample: sample(1, 100) },
    { type: "telemetry", sample: sample(2, 200) },
    { ...run, phase: "end", state: "ready", finishedAtMs: 2000 },
    { type: "status", state: "ready", detail: "Stopped" },
  );
}

describe("completed run export destinations", () => {
  it.each([
    ["Export run data as CSV", "csv"],
    ["Export plots as SVG", "svg"],
    ["Export plots as PNG", "png"],
    ["Export world animation as WebM", "webm"],
  ])(
    "%s waits for the original run folder, independently of a delayed archive commit",
    async (button, extension) => {
      await act(async () => root.render(createElement(DashboardApp)));
      const destination = deferred<{ folder: typeof boundary.folder }>();
      const commit = deferred<unknown>();
      boundary.loadBinding.mockReturnValue(destination.promise);
      boundary.archive.mockReturnValue(commit.promise);
      await finishRunForExport();
      await click(button);
      expect(host.querySelector(".export-detail")?.textContent).toBe(
        "Locating the run's Project folder…",
      );
      expect(boundary.write).not.toHaveBeenCalled();
      expect(boundary.download).not.toHaveBeenCalled();
      // Changing the target's current Project while resolution is pending must
      // not select another folder for the already captured completed run.
      await emit({
        type: "project",
        project: { ...boundary.project, projectId: "project-b", name: "Other" },
      });
      await act(async () => {
        destination.resolve({ folder: boundary.folder });
        await vi.waitFor(() => expect(boundary.write).toHaveBeenCalledOnce());
      });
      expect(boundary.loadBinding).toHaveBeenCalledExactlyOnceWith("project-a");
      expect(boundary.archive).toHaveBeenCalledOnce();
      expect(boundary.write.mock.calls[0]?.[0]).toBe(boundary.folder);
      expect(boundary.write.mock.calls[0]?.[1]).toMatch(
        new RegExp(`^exports/xrp-.*\\.${extension}$`),
      );
      expect(host.querySelector(".export-detail")?.textContent).toMatch(
        new RegExp(`^Saved \\./Project/exports/xrp-.*\\.${extension}$`),
      );
      expect(boundary.download).not.toHaveBeenCalled();
      // The export has completed before this independent archive operation.
      await act(async () => commit.resolve({}));
    },
  );

  it.each(["unresolved identity", "revoked folder access"])(
    "preserves browser recovery for %s and labels download initiation honestly",
    async (failure) => {
      await act(async () => root.render(createElement(DashboardApp)));
      if (failure === "unresolved identity")
        boundary.loadBinding.mockRejectedValue(new Error("Folder unavailable"));
      await finishRunForExport();
      if (failure === "revoked folder access")
        boundary.permission.mockResolvedValue("denied");
      await click("Export run data as CSV");
      expect(boundary.download).toHaveBeenCalledOnce();
      expect(boundary.write).not.toHaveBeenCalled();
      expect(host.querySelector(".export-detail")?.textContent).toMatch(
        /^Download requested: xrp-telemetry-.*\.csv\. Check your browser downloads\.$/,
      );
      expect(host.querySelector(".export-detail")?.textContent).not.toContain(
        "Saved",
      );
    },
  );

  it("clears pending export feedback after canceling a native recovery Save dialog", async () => {
    await act(async () => root.render(createElement(DashboardApp)));
    boundary.loadBinding.mockRejectedValue(new Error("Folder unavailable"));
    vi.stubGlobal(
      "showSaveFilePicker",
      vi.fn().mockRejectedValue(new DOMException("Canceled", "AbortError")),
    );
    await finishRunForExport();
    await click("Export run data as CSV");
    expect(host.querySelector(".export-detail")?.textContent).toBe(
      "Export canceled.",
    );
    expect(boundary.write).not.toHaveBeenCalled();
    expect(boundary.download).not.toHaveBeenCalled();
    const csv = [...host.querySelectorAll("button")].find(
      (button) => button.textContent === "Export run data as CSV",
    );
    expect(csv?.disabled).toBe(false);
  });
});

describe("explicit saved trial and current XRP boundaries", () => {
  it("keeps the folder's saved-run picker identity when the current target descriptor omits projectId", async () => {
    await act(async () => root.render(createElement(DashboardApp)));
    const { projectId: _projectId, ...targetProject } = boundary.project;
    await emit({ type: "project", project: targetProject });
    await click("Open saved run…");
    await click("Open trial");
    expect(boundary.readSavedRun).toHaveBeenCalledExactlyOnceWith(
      boundary.folder,
      "project-a",
      "saved-a",
      expect.objectContaining({
        assertCurrent: expect.any(Function),
        onWait: expect.any(Function),
      }),
    );
    expect(host.querySelector(".saved-run-banner")).not.toBeNull();
  });

  it("discovers program signals from a completed late-join replay and preserves hidden choices across runtime publications", async () => {
    await act(async () => root.render(createElement(DashboardApp)));
    const travel = {
      name: "travel_mm",
      label: "Travel",
      unit: "mm",
      value: 12,
    };
    const yaw = {
      name: "turn_rate_rad_s",
      label: "Yaw rate",
      unit: "rad/s",
      value: 0.4,
    };
    const retained: Extract<TargetEvent, { type: "run-history" }> = {
      type: "run-history",
      phase: "begin",
      runId: "completed-without-monitor",
      projectId: boundary.project.projectId,
      projectName: boundary.project.name,
      projectRevision: boundary.project.revision,
      startedAtMs: 1000,
      finishedAtMs: 2000,
      state: "ready",
      detail: "Stopped in IDE",
    };
    await emit(
      {
        type: "runtime",
        state: { revision: 0, parameters: [], watches: [], plots: [] },
      },
      retained,
      {
        type: "telemetry",
        replayed: true,
        sample: { ...sample(1, 12), plotValues: [travel, yaw] },
      },
      {
        type: "telemetry",
        replayed: true,
        sample: {
          ...sample(2, 24),
          plotValues: [
            { ...travel, value: 24 },
            { ...yaw, value: 0.3 },
          ],
        },
      },
      { ...retained, phase: "end" },
    );
    const choice = (label: string) =>
      [...host.querySelectorAll<HTMLLabelElement>(".program-signal-choice")]
        .find((item) => item.querySelector("span")?.textContent === label)!
        .querySelector<HTMLInputElement>("input")!;
    const plot = (name: string) =>
      host.querySelector(`[data-test-plot="program:${name}"]`);
    expect(boundary.readSavedRun).not.toHaveBeenCalled();
    expect(choice("Travel").checked).toBe(true);
    expect(choice("Yaw rate").checked).toBe(true);
    expect(plot("travel_mm")?.textContent).toBe("[[12],[24]]");
    expect(plot("turn_rate_rad_s")?.textContent).toBe("[[0.4],[0.3]]");
    await act(async () => choice("Travel").click());
    expect(choice("Travel").checked).toBe(false);
    expect(plot("travel_mm")).toBeNull();
    for (const plots of [[yaw], [travel, yaw]]) {
      await emit({
        type: "runtime",
        state: { revision: 1, parameters: [], watches: [], plots },
      });
    }
    expect(choice("Travel").checked).toBe(false);
    expect(plot("travel_mm")).toBeNull();
    expect(choice("Yaw rate").checked).toBe(true);
    expect(plot("turn_rate_rad_s")?.textContent).toBe("[[0.4],[0.3]]");
  });

  it("preserves the selected trial through idle Reset and completed reconnect history, then follows a genuinely new live run", async () => {
    await act(async () => root.render(createElement(DashboardApp)));
    await click("Open saved run…");
    await click("Open trial");
    const world = () => host.querySelector('[data-testid="world-view"]')!;
    const assertSavedWorld = () => {
      expect(host.querySelector(".saved-run-banner")).not.toBeNull();
      expect(world().getAttribute("data-x")).toBe("100");
      expect(world().getAttribute("data-history")).toBe("1");
      expect(world().getAttribute("data-notes")).toBe("1");
    };
    assertSavedWorld();
    await emit(
      {
        type: "console",
        stream: "system",
        action: "reset",
        phase: "result",
        line: "Reset completed",
      },
      {
        type: "telemetry",
        sample: { ...sample(0, 0), observationKind: "reset" },
      },
    );
    assertSavedWorld();
    const retained: Extract<TargetEvent, { type: "run-history" }> = {
      type: "run-history",
      phase: "begin",
      runId: "completed-b",
      startedAtMs: 2000,
      finishedAtMs: 3000,
      state: "ready",
      detail: "Completed in another tab",
    };
    await emit(
      retained,
      { type: "telemetry", replayed: true, sample: sample(10, 200) },
      { ...retained, phase: "end" },
      { type: "telemetry", sample: sample(11, 250) },
    );
    assertSavedWorld();
    expect(host.querySelector('[data-testid="x-mm"]')?.textContent).toBe(
      "250.0 mm",
    );
    expect(host.textContent).toContain("Saved observation");
    await emit(
      {
        type: "run",
        phase: "begin",
        runId: "new-live-c",
        startedAtMs: 4000,
        state: "running",
        detail: "New Run",
      },
      { type: "status", state: "running", detail: "New Run" },
      { type: "telemetry", sample: sample(1, 350) },
    );
    expect(host.querySelector(".saved-run-banner")).toBeNull();
    expect(world().getAttribute("data-x")).toBe("350");
    expect(world().getAttribute("data-notes")).toBe("0");
    expect(
      host.querySelector('[data-testid="recording-count"]')?.textContent,
    ).toContain("1 samples");
    // The saved source passed to the component was never altered by either run.
    expect(saved.recording.samples[0]?.xMm).toBe(100);
    expect(saved.annotations[0]?.label).toBe("Saved observation");
  });
});
