import { LineChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  millidegreesPerSecondToRadiansPerSecond,
  milligravityToMetersPerSecondSquared,
  type TelemetrySample,
} from "@ucsb-xrp/target";

import type { MonitorAnnotation } from "./monitor-export";

echarts.use([
  LineChart,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
]);

export type SignalPlotId =
  | "wheel-speed"
  | "motor-effort"
  | "pose-error"
  | "range"
  | "acceleration"
  | "angular-rate";

interface SignalSeriesDefinition {
  label: string;
  color: string;
  dash?: "dashed" | "dotted";
  displayAverageMs?: number;
  value: (sample: TelemetrySample) => number | null;
}

export interface SignalPlotDefinition {
  id: SignalPlotId;
  label: string;
  unit: string;
  description: string;
  fixedRange?: readonly [number, number];
  series: readonly SignalSeriesDefinition[];
}

export const SIGNAL_PLOTS: readonly SignalPlotDefinition[] = [
  {
    id: "wheel-speed",
    label: "Wheel speed (120 ms mean)",
    unit: "mm/s",
    description:
      "Target wheel speeds and 120 ms display averages of encoder-derived measurements. Telemetry recordings retain every raw sample.",
    series: [
      {
        label: "Encoder L",
        color: "#08736b",
        displayAverageMs: 120,
        value: (sample) => sample.leftWheelSpeedMmS,
      },
      {
        label: "Encoder R",
        color: "#a66b08",
        dash: "dashed",
        displayAverageMs: 120,
        value: (sample) => sample.rightWheelSpeedMmS,
      },
      {
        label: "Target L",
        color: "#205f99",
        dash: "dotted",
        value: (sample) => sample.targetLeftWheelSpeedMmS ?? null,
      },
      {
        label: "Target R",
        color: "#87515d",
        dash: "dotted",
        value: (sample) => sample.targetRightWheelSpeedMmS ?? null,
      },
    ],
  },
  {
    id: "motor-effort",
    label: "Drive command u",
    unit: "−1…+1",
    description: "Dimensionless left and right drive commands from −1 to +1",
    fixedRange: [-1, 1],
    series: [
      {
        label: "Left",
        color: "#08736b",
        value: (sample) => sample.leftEffort,
      },
      {
        label: "Right",
        color: "#a66b08",
        dash: "dashed",
        value: (sample) => sample.rightEffort,
      },
    ],
  },
  {
    id: "pose-error",
    label: "Odometry check (virtual)",
    unit: "mm",
    description:
      "Simulation-only difference between student odometry and the simulator's true pose. The true pose is not available to robot code or a physical XRP.",
    series: [
      {
        label: "Position error",
        color: "#87515d",
        value: (sample) =>
          sample.estimatedPoseAvailable &&
          sample.groundTruthPoseAvailable &&
          sample.estimatedXmm !== null &&
          sample.estimatedXmm !== undefined &&
          sample.estimatedYmm !== null &&
          sample.estimatedYmm !== undefined &&
          sample.groundTruthXmm !== null &&
          sample.groundTruthXmm !== undefined &&
          sample.groundTruthYmm !== null &&
          sample.groundTruthYmm !== undefined
            ? Math.hypot(
                sample.estimatedXmm - sample.groundTruthXmm,
                sample.estimatedYmm - sample.groundTruthYmm,
              )
            : null,
      },
    ],
  },
  {
    id: "range",
    label: "Ultrasound distance",
    unit: "mm",
    description: "Forward ultrasound distance",
    series: [
      {
        label: "Range",
        color: "#205f99",
        value: (sample) => sample.rangeMm,
      },
    ],
  },
  {
    id: "acceleration",
    label: "Acceleration",
    unit: "m/s²",
    description: "IMU acceleration along the x, y, and z axes",
    series: [
      {
        label: "x",
        color: "#08736b",
        value: (sample) =>
          sample.accelerationMg
            ? milligravityToMetersPerSecondSquared(sample.accelerationMg[0])
            : null,
      },
      {
        label: "y",
        color: "#a66b08",
        dash: "dashed",
        value: (sample) =>
          sample.accelerationMg
            ? milligravityToMetersPerSecondSquared(sample.accelerationMg[1])
            : null,
      },
      {
        label: "z",
        color: "#a02d27",
        dash: "dotted",
        value: (sample) =>
          sample.accelerationMg
            ? milligravityToMetersPerSecondSquared(sample.accelerationMg[2])
            : null,
      },
    ],
  },
  {
    id: "angular-rate",
    label: "Yaw rate ωz",
    unit: "rad/s",
    description: "IMU angular rate about the vertical z axis",
    series: [
      {
        label: "ωz",
        color: "#205f99",
        value: (sample) =>
          sample.angularRateMdps
            ? millidegreesPerSecondToRadiansPerSecond(sample.angularRateMdps[2])
            : null,
      },
    ],
  },
] as const;

export function signalPlotDefinition(id: SignalPlotId): SignalPlotDefinition {
  const definition = SIGNAL_PLOTS.find((candidate) => candidate.id === id);
  if (!definition) {
    throw new Error(`Unknown signal plot: ${id}`);
  }
  return definition;
}

export function signalPlotData(
  samples: readonly TelemetrySample[],
  id: SignalPlotId,
  timeWindowS: number,
): Array<{ name: string; values: Array<[number, number | null]> }> {
  const definition = signalPlotDefinition(id);
  const latestMs = samples.at(-1)?.tMs ?? 0;
  const startMs = latestMs - timeWindowS * 1_000;
  const firstVisibleIndex = Math.max(
    0,
    samples.findIndex((sample) => sample.tMs >= startMs),
  );
  return definition.series.map((series) => {
    const raw = samples.map(series.value);
    let display = raw;
    if (series.displayAverageMs !== undefined) {
      let first = 0;
      let sum = 0;
      let count = 0;
      display = raw.map((current, index) => {
        if (current !== null) {
          sum += current;
          count += 1;
        }
        while (
          first < index &&
          samples[index]!.tMs - samples[first]!.tMs > series.displayAverageMs!
        ) {
          const removed = raw[first];
          if (removed !== null && removed !== undefined) {
            sum -= removed;
            count -= 1;
          }
          first += 1;
        }
        return count > 0 ? sum / count : null;
      });
    }
    return {
      name: series.label,
      values: samples
        .slice(firstVisibleIndex)
        .map((sample, offset) => [
          (sample.tMs - latestMs) / 1_000,
          display[firstVisibleIndex + offset] ?? null,
        ]),
    };
  });
}

interface SignalPlotProps {
  annotations?: readonly MonitorAnnotation[];
  id: SignalPlotId;
  onAddAnnotation?: (tMs: number, label: string) => void;
  samples: readonly TelemetrySample[];
  showAnnotations?: boolean;
  timeWindowS: number;
}

export function signalXAxis(timeWindowS: number) {
  return {
    type: "value" as const,
    min: -timeWindowS,
    max: 0,
    name: "time (s)",
    nameGap: 12,
    nameTextStyle: { color: "#56636c", fontSize: 8 },
    axisLabel: { color: "#56636c", fontSize: 8 },
    axisLine: { lineStyle: { color: "#737f88", width: 1 } },
    splitLine: { lineStyle: { color: "#d5dadd", width: 1 } },
    minorTick: { show: false, splitNumber: 2 },
    minorSplitLine: {
      show: true,
      lineStyle: { color: "#eceff0", width: 1 },
    },
  };
}

export function SignalPlot({
  annotations = [],
  id,
  onAddAnnotation,
  samples,
  showAnnotations = true,
  timeWindowS,
}: SignalPlotProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const noteInputRef = useRef<HTMLInputElement>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteLocation, setNoteLocation] = useState<{
    left: number;
    tMs: number;
  } | null>(null);
  const definition = useMemo(() => signalPlotDefinition(id), [id]);

  useEffect(() => {
    noteInputRef.current?.focus();
  }, [noteLocation]);

  useEffect(() => {
    if (!elementRef.current) {
      return;
    }
    const chart = echarts.init(elementRef.current, undefined, {
      renderer: "canvas",
    });
    chartRef.current = chart;
    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(elementRef.current);
    return () => {
      resizeObserver.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const data = signalPlotData(samples, id, timeWindowS);
    const latestMs = samples.at(-1)?.tMs ?? 0;
    const startMs = latestMs - timeWindowS * 1_000;
    const visibleAnnotations = showAnnotations
      ? annotations.filter(
          (annotation) =>
            annotation.tMs >= startMs && annotation.tMs <= latestMs,
        )
      : [];
    chartRef.current?.setOption(
      {
        animation: false,
        backgroundColor: "transparent",
        title: {
          left: 5,
          top: 2,
          text: `${definition.label} · ${definition.unit}`,
          textStyle: {
            color: "#17232b",
            fontFamily: "system-ui, sans-serif",
            fontSize: 9,
            fontWeight: 600,
          },
        },
        grid: { left: 36, right: 6, top: 18, bottom: 21 },
        legend: {
          top: 1,
          right: 6,
          textStyle: { color: "#3f4d55", fontSize: 8 },
          icon: "roundRect",
          itemHeight: 4,
          itemWidth: 8,
        },
        tooltip: {
          trigger: "axis",
          backgroundColor: "#ffffff",
          borderColor: "#737f88",
          textStyle: { color: "#182128", fontSize: 9 },
        },
        xAxis: signalXAxis(timeWindowS),
        yAxis: {
          type: "value",
          min: definition.fixedRange?.[0],
          max: definition.fixedRange?.[1],
          scale: definition.fixedRange === undefined,
          axisLabel: { color: "#56636c", fontSize: 8 },
          axisLine: { show: true, lineStyle: { color: "#737f88" } },
          splitLine: { lineStyle: { color: "#d5dadd", width: 1 } },
        },
        series: definition.series.map((series, index) => ({
          name: series.label,
          type: "line",
          showSymbol: false,
          connectNulls: false,
          itemStyle: { color: series.color },
          lineStyle: {
            color: series.color,
            type: series.dash,
            width: 1.4,
          },
          data: data[index]?.values ?? [],
          markLine:
            index === 0 && visibleAnnotations.length > 0
              ? {
                  silent: true,
                  symbol: ["none", "none"],
                  lineStyle: {
                    color: "#87515d",
                    type: "dashed",
                    width: 1,
                  },
                  label: {
                    color: "#75434d",
                    fontSize: 8,
                    formatter: "{b}",
                    position: "insideEndTop",
                  },
                  data: visibleAnnotations.map((annotation) => ({
                    name: `${(annotation.tMs / 1_000).toFixed(2)} s · ${annotation.label}`,
                    xAxis: (annotation.tMs - latestMs) / 1_000,
                  })),
                }
              : undefined,
        })),
      },
      { notMerge: true, lazyUpdate: true },
    );
  }, [annotations, definition, id, samples, showAnnotations, timeWindowS]);

  const openNoteAt = (clientX?: number) => {
    const shell = shellRef.current;
    const latestMs = samples.at(-1)?.tMs;
    if (!shell || latestMs === undefined || !onAddAnnotation) return;
    const bounds = shell.getBoundingClientRect();
    const plotLeft = 36;
    const plotRight = 6;
    const width = Math.max(1, bounds.width - plotLeft - plotRight);
    const relative = Math.min(
      width,
      Math.max(
        0,
        (clientX ?? bounds.right - plotRight) - bounds.left - plotLeft,
      ),
    );
    const fraction = relative / width;
    setNoteLocation({
      left: Math.min(
        Math.max(73, bounds.width - 73),
        Math.max(73, plotLeft + relative),
      ),
      tMs: latestMs + (-timeWindowS + fraction * timeWindowS) * 1_000,
    });
    setNoteDraft("");
  };

  const saveNote = () => {
    const label = noteDraft.trim();
    if (!label || !noteLocation || !onAddAnnotation) return;
    onAddAnnotation(noteLocation.tMs, label);
    setNoteLocation(null);
    setNoteDraft("");
  };

  return (
    <div
      aria-label={`${definition.description} over the last ${timeWindowS} seconds`}
      className="signal-plot-shell"
      onContextMenu={(event) => {
        if (!onAddAnnotation || samples.length === 0) return;
        event.preventDefault();
        openNoteAt(event.clientX);
      }}
      onKeyDown={(event) => {
        if (
          (event.key === "Enter" || event.key.toLowerCase() === "n") &&
          event.target === event.currentTarget
        ) {
          event.preventDefault();
          openNoteAt();
        }
      }}
      ref={shellRef}
      role="group"
      tabIndex={onAddAnnotation && samples.length > 0 ? 0 : -1}
      title="Right-click a time to add a note. Keyboard: focus the plot and press N."
    >
      <div
        className="signal-plot"
        data-testid={
          id === "wheel-speed" ? "wheel-speed-plot" : `strip-chart-${id}`
        }
        ref={elementRef}
        role="img"
      />
      {noteLocation ? (
        <form
          aria-label={`Add note to ${definition.label}`}
          className="plot-note-editor"
          onSubmit={(event) => {
            event.preventDefault();
            saveNote();
          }}
          style={{ left: `${noteLocation.left}px` }}
        >
          <input
            aria-label="Note label"
            maxLength={72}
            onChange={(event) => setNoteDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                setNoteLocation(null);
              }
            }}
            placeholder="Short note"
            ref={noteInputRef}
            value={noteDraft}
          />
          <button disabled={!noteDraft.trim()} type="submit">
            Add
          </button>
        </form>
      ) : null}
    </div>
  );
}
