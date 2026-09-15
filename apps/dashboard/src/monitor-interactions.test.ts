// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TelemetrySample, RuntimeState } from "@ucsb-xrp/target";
import { RuntimeControls } from "./RuntimeControls";
import {
  MonitorNoteEditor,
  MonitorNotes,
  type NoteRequest,
} from "./MonitorNotes";
import { SignalPlot, SIGNAL_PLOTS } from "./SignalPlot";

const chart = vi.hoisted(() => ({
  resize: vi.fn(),
  isDisposed: () => false,
  dispose: vi.fn(),
  setOption: vi.fn(),
  dispatchAction: vi.fn(),
}));
vi.mock("echarts/core", () => ({ use: vi.fn(), init: () => chart }));

let root: Root;
let host: HTMLDivElement;
const telemetry = (observationSeq: number, speed: number): TelemetrySample =>
  ({
    source: "virtual",
    seq: 5,
    observationSeq,
    physicsStepSeq: 5,
    tMs: 100,
    poseAvailable: true,
    xMm: 10,
    yMm: 20,
    leftWheelSpeedMmS: speed,
    rightWheelSpeedMmS: speed + 1,
  }) as TelemetrySample;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private callback: () => void) {}
      observe() {
        this.callback();
      }
      disconnect() {}
    },
  );
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get: () => 480,
  });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get: () => 180,
  });
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value() {
      this.setAttribute("open", "");
    },
  });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
const render = async (element: ReturnType<typeof createElement>) =>
  act(async () => {
    root.render(element);
  });
const typeNote = async (text: string) =>
  act(async () => {
    const input = host.querySelector("textarea")!;
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )!.set!.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

describe("Monitor inspection and notes", () => {
  it("shows one value per series and lets keyboard inspection select repeated-time observations for a note", async () => {
    const samples = [telemetry(40, 0), telemetry(41, 7), telemetry(42, 12)];
    const onRequestAnnotation = vi.fn();
    await render(
      createElement(SignalPlot, {
        definition: {
          ...SIGNAL_PLOTS[0]!,
          series: SIGNAL_PLOTS[0]!.series.slice(0, 2),
        },
        samples,
        timeWindowS: 5,
        onRequestAnnotation,
      }),
    );
    const options = chart.setOption.mock.calls.at(-1)![0];
    const group = host.querySelector<HTMLElement>(".signal-plot-shell")!;
    await act(async () => {
      group.focus();
      group.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
      );
    });
    const tooltip = host.querySelector('[role="tooltip"]')!;
    expect(tooltip.textContent).toContain("0.100 s · observation 41");
    expect(tooltip.textContent).toContain("7 mm/s");
    expect(tooltip.textContent).toContain("8 mm/s");
    expect(tooltip.querySelectorAll(".signal-inspection-row")).toHaveLength(2);
    expect(
      options.series.every(
        (series: { symbol: string; emphasis: { scale: boolean } }) =>
          series.symbol === "none" && !series.emphasis.scale,
      ),
    ).toBe(true);
    await act(async () => {
      group.focus();
      group.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
      );
      group.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
    });
    expect(onRequestAnnotation).toHaveBeenLastCalledWith(samples[2]);
    expect(host.querySelector(".signal-plot-heading strong")?.textContent).toBe(
      "Wheel speeds",
    );
  });

  it("keeps one pointer-selected observation readable across live data repaint and clears it when no longer retained", async () => {
    const definition = {
      ...SIGNAL_PLOTS[0]!,
      series: SIGNAL_PLOTS[0]!.series.slice(0, 2),
    };
    const samples = [
      telemetry(40, 0),
      telemetry(41, 7),
      { ...telemetry(42, 12), tMs: 120 },
    ];
    const onRequestAnnotation = vi.fn();
    const draw = (rows: TelemetrySample[]) =>
      render(
        createElement(SignalPlot, {
          definition,
          samples: rows,
          timeWindowS: 0.5,
          onRequestAnnotation,
        }),
      );
    await draw(samples);
    const group = host.querySelector<HTMLElement>(".signal-plot-shell")!;
    group.getBoundingClientRect = () => ({
      x: 10,
      y: 20,
      left: 10,
      top: 20,
      right: 490,
      bottom: 200,
      width: 480,
      height: 180,
      toJSON() {},
    });
    await act(async () =>
      group.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: 466,
          clientY: 80,
          bubbles: true,
        }),
      ),
    );
    const selected = host.querySelector('[role="tooltip"]')!.textContent;
    expect(selected).toContain("observation 41");
    expect(selected).toContain("7 mm/s");
    await draw([
      ...samples.map((sample) => ({ ...sample })),
      { ...telemetry(43, 20), tMs: 140 },
    ]);
    expect(host.querySelector('[role="tooltip"]')?.textContent).toBe(selected);
    expect(chart.setOption.mock.calls.at(-1)![0].tooltip.show).toBe(false);
    await act(async () =>
      group.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          bubbles: true,
        }),
      ),
    );
    expect(onRequestAnnotation).toHaveBeenLastCalledWith(samples[1]);
    await draw([{ ...telemetry(100, 80), tMs: 1000 }]);
    expect(host.querySelector('[role="tooltip"]')).toBeNull();
  });

  it("retains a captured observation and text after a failed save, then supports selecting another update at the same time", async () => {
    const first = telemetry(40, 0),
      second = telemetry(41, 7);
    const request: NoteRequest = {
      runId: "run-a",
      sample: second,
      alternatives: [first, second],
    };
    const onSubmit = vi.fn().mockImplementationOnce(() => {
      throw new Error("The run changed; retain this text.");
    });
    const onClose = vi.fn(),
      onDraftChange = vi.fn();
    await render(
      createElement(MonitorNoteEditor, {
        request,
        onSubmit,
        onClose,
        onDraftChange,
      }),
    );
    expect(document.activeElement).toBe(host.querySelector("textarea"));
    await typeNote("wheel change\ncheck this observation");
    await act(async () => {
      host
        .querySelector("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
    });
    expect(onSubmit).toHaveBeenCalledWith(
      second,
      "wheel change\ncheck this observation",
      request,
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(host.querySelector('[role="alert"]')?.textContent).toContain(
      "retain this text",
    );
    expect(host.querySelector("textarea")?.value).toContain("wheel change");
    await act(async () => {
      const select = host.querySelector("select")!;
      select.value = "0";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(
      host.querySelector('[data-testid="note-anchor"]')?.textContent,
    ).toContain("observation 40");
    await act(async () => {
      host
        .querySelector("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
    });
    expect(onSubmit).toHaveBeenLastCalledWith(
      first,
      "wheel change\ncheck this observation",
      request,
    );
    expect(onClose).toHaveBeenCalledOnce();
    expect(onDraftChange).toHaveBeenCalledWith(true);
  });

  it("keeps full note text and time available through visible review buttons", async () => {
    const note = {
      id: "n",
      label:
        "A complete note with information beyond the old thirty-two character label",
      source: "virtual" as const,
      seq: 5,
      observationSeq: 41,
      tMs: 100,
      poseAvailable: true,
      xMm: 10,
      yMm: 20,
    };
    const onEdit = vi.fn();
    await render(
      createElement(MonitorNotes, {
        annotations: [note],
        visible: true,
        canAdd: true,
        feedback: "Saved",
        onAdd: vi.fn(),
        onEdit,
        onToggle: vi.fn(),
      }),
    );
    expect(host.textContent).toContain(note.label);
    expect(host.textContent).toContain("0.100 s");
    await act(async () => {
      host
        .querySelector<HTMLButtonElement>(".monitor-note-list button")!
        .click();
    });
    expect(onEdit).toHaveBeenCalledWith(note);
  });

  it("keeps Stop available inside the editor without changing or discarding the draft", async () => {
    const sample = telemetry(41, 7);
    let stopped!: () => void;
    const onStop = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          stopped = resolve;
        }),
    );
    const onClose = vi.fn(),
      onSubmit = vi.fn(),
      onDraftChange = vi.fn();
    const request = { runId: "live", sample, alternatives: [sample] };
    await render(
      createElement(MonitorNoteEditor, {
        request,
        canStop: true,
        onStop,
        onClose,
        onSubmit,
        onDraftChange,
      }),
    );
    await typeNote("Keep this while stopping");
    await act(async () => {
      host.querySelector<HTMLButtonElement>(".danger-button")!.click();
    });
    expect(onStop).toHaveBeenCalledOnce();
    expect(
      host.querySelector<HTMLButtonElement>(".danger-button")?.disabled,
    ).toBe(true);
    expect(host.querySelector("textarea")?.value).toBe(
      "Keep this while stopping",
    );
    await act(async () => {
      stopped();
    });
    await render(
      createElement(MonitorNoteEditor, {
        request,
        canStop: false,
        onStop,
        onClose,
        onSubmit,
        onDraftChange,
      }),
    );
    expect(
      host.querySelector('[data-testid="note-anchor"]')?.textContent,
    ).toContain("observation 41");
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => {
      host
        .querySelector("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
    });
    expect(onSubmit).toHaveBeenCalledWith(
      sample,
      "Keep this while stopping",
      request,
    );
  });
});

describe("Live control feedback", () => {
  const runtime: RuntimeState = {
    revision: 1,
    parameters: [
      {
        name: "speed",
        label: "Speed",
        kind: "number",
        value: 100,
        minimum: 0,
        maximum: 200,
        step: 10,
        unit: "mm/s",
      },
    ],
    watches: [],
    plots: [],
  };
  it("distinguishes pending and accepted values until a matching runtime update", async () => {
    const props = {
      runtime,
      drafts: { speed: 120 },
      error: "",
      targetState: "running" as const,
      onChange: vi.fn(),
    };
    await render(createElement(RuntimeControls, props));
    expect(host.textContent).toContain("Applying…");
    expect(host.textContent).toContain("Accepted: 100 mm/s");
    expect(host.textContent).not.toContain("1 controls");
    await render(
      createElement(RuntimeControls, {
        ...props,
        drafts: {},
        runtime: {
          ...runtime,
          parameters: [{ ...runtime.parameters[0]!, value: 120 }],
        },
      }),
    );
    expect(host.textContent).not.toContain("Applying…");
    expect(host.querySelector("output")?.textContent).toBe("120 mm/s");
    await render(
      createElement(RuntimeControls, {
        ...props,
        drafts: {},
        error: "Rejected by XRP",
        canControl: false,
      }),
    );
    expect(host.querySelector<HTMLInputElement>("input")?.disabled).toBe(true);
    expect(host.querySelector('[role="alert"]')?.textContent).toBe(
      "Rejected by XRP",
    );
  });
});
