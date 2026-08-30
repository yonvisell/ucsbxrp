import { LineChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TitleComponent,
  TooltipComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import {
  millidegreesPerSecondToRadiansPerSecond,
  milligravityToMetersPerSecondSquared,
  type RuntimePlot,
  type TelemetrySample,
} from "@ucsb-xrp/target";

import type { MonitorAnnotation } from "./monitor-export";

echarts.use([
  LineChart,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
]);

export type SignalPlotId =
  | "wheel-speed"
  | "wheel-distance"
  | "motor-effort"
  | "pose-error"
  | "range"
  | "acceleration"
  | "angular-rate";

interface SignalSeriesDefinition {
  label: string;
  color: string;
  dash?: "dashed" | "dotted";
  value: (sample: TelemetrySample) => number | null;
}

export interface SignalPlotDefinition {
  id: string;
  label: string;
  axisLabel: string;
  title?: string;
  unit: string;
  description: string;
  fixedRange?: readonly [number, number];
  series: readonly SignalSeriesDefinition[];
}

interface BuiltInSignalPlotDefinition extends SignalPlotDefinition {
  id: SignalPlotId;
}

export const SIGNAL_PLOTS: readonly BuiltInSignalPlotDefinition[] = [
  {
    id: "wheel-speed",
    label: "Wheel speed",
    axisLabel: "v_L, v_R",
    unit: "mm/s",
    description:
      "Target wheel speeds and wheel-speed estimates based on recent encoder samples. The controller uses the same estimates.",
    series: [
      {
        label: "measured v_L",
        color: "#08736b",
        value: (sample) => sample.leftWheelSpeedMmS,
      },
      {
        label: "measured v_R",
        color: "#a66b08",
        dash: "dashed",
        value: (sample) => sample.rightWheelSpeedMmS,
      },
      {
        label: "target v_L",
        color: "#205f99",
        dash: "dotted",
        value: (sample) => sample.targetLeftWheelSpeedMmS ?? null,
      },
      {
        label: "target v_R",
        color: "#87515d",
        dash: "dotted",
        value: (sample) => sample.targetRightWheelSpeedMmS ?? null,
      },
    ],
  },
  {
    id: "wheel-distance",
    label: "Wheel distance",
    axisLabel: "d_L, d_R",
    unit: "mm",
    description:
      "Signed left and right wheel distance calculated by SensorModel from encoder counts.",
    series: [
      {
        label: "d_L",
        color: "#08736b",
        value: (sample) => sample.leftWheelDistanceMm ?? null,
      },
      {
        label: "d_R",
        color: "#a66b08",
        dash: "dashed",
        value: (sample) => sample.rightWheelDistanceMm ?? null,
      },
    ],
  },
  {
    id: "motor-effort",
    label: "Drive command",
    axisLabel: "u_L, u_R",
    title: "Drive command: u_L, u_R",
    unit: "−1…+1",
    description: "Dimensionless left and right drive commands from −1 to +1",
    fixedRange: [-1, 1],
    series: [
      {
        label: "u_L",
        color: "#08736b",
        value: (sample) => sample.leftEffort,
      },
      {
        label: "u_R",
        color: "#a66b08",
        dash: "dashed",
        value: (sample) => sample.rightEffort,
      },
    ],
  },
  {
    id: "pose-error",
    label: "Odometry check (virtual)",
    axisLabel: "e_position",
    unit: "mm",
    description:
      "Simulation-only difference between student odometry and the simulator's true pose. The true pose is not available to robot code or a physical XRP.",
    series: [
      {
        label: "e_position",
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
    axisLabel: "d_range",
    unit: "mm",
    description: "Forward ultrasound distance",
    series: [
      {
        label: "d_range",
        color: "#205f99",
        value: (sample) => sample.rangeMm,
      },
    ],
  },
  {
    id: "acceleration",
    label: "Acceleration",
    axisLabel: "a_x, a_y, a_z",
    unit: "m/s²",
    description: "IMU acceleration along the x, y, and z axes",
    series: [
      {
        label: "a_x",
        color: "#08736b",
        value: (sample) =>
          sample.accelerationMg
            ? milligravityToMetersPerSecondSquared(sample.accelerationMg[0])
            : null,
      },
      {
        label: "a_y",
        color: "#a66b08",
        dash: "dashed",
        value: (sample) =>
          sample.accelerationMg
            ? milligravityToMetersPerSecondSquared(sample.accelerationMg[1])
            : null,
      },
      {
        label: "a_z",
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
    axisLabel: "ωz",
    unit: "rad/s",
    description: "IMU yaw rate about the vertical z axis",
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

export function runtimePlotDefinition(plot: RuntimePlot): SignalPlotDefinition {
  return {
    id: `program:${plot.name}`,
    label: plot.label,
    axisLabel: plot.name,
    unit: plot.unit || "unitless",
    description: `${plot.label} published by the running program.`,
    series: [
      {
        label: plot.label,
        color: "#08736b",
        value: (sample) =>
          sample.plotValues?.find((value) => value.name === plot.name)?.value ??
          null,
      },
    ],
  };
}

export function signalPlotTitle(definition: SignalPlotDefinition): string {
  return definition.title ?? `${definition.label} • ${definition.axisLabel}`;
}

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
  return signalPlotDataForDefinition(
    samples,
    signalPlotDefinition(id),
    timeWindowS,
  );
}

export function signalPlotDataForDefinition(
  samples: readonly TelemetrySample[],
  definition: SignalPlotDefinition,
  timeWindowS: number,
): Array<{ name: string; values: Array<[number, number | null]> }> {
  const latestMs = samples.at(-1)?.tMs ?? 0;
  const startMs = latestMs - timeWindowS * 1_000;
  const firstVisibleIndex = Math.max(
    0,
    samples.findIndex((sample) => sample.tMs >= startMs),
  );
  return definition.series.map((series) => {
    return {
      name: series.label,
      values: samples
        .slice(firstVisibleIndex)
        .map((sample, offset) => [
          (sample.tMs - latestMs) / 1_000,
          series.value(samples[firstVisibleIndex + offset]!) ?? null,
        ]),
    };
  });
}

interface SignalPlotProps {
  active?: boolean;
  annotations?: readonly MonitorAnnotation[];
  definition: SignalPlotDefinition;
  onAddAnnotation?: (sample: TelemetrySample, label: string) => void;
  onAnnotationDraftChange?: (plotId: string, active: boolean) => void;
  samples: readonly TelemetrySample[];
  showAnnotations?: boolean;
  timeWindowS: number;
}

export function signalXAxis(timeWindowS: number) {
  return {
    type: "value" as const,
    min: -timeWindowS,
    max: 0,
    name: "t (s)",
    nameGap: -3,
    nameLocation: "end" as const,
    nameTextStyle: {
      align: "right" as const,
      color: "#000000",
      fontSize: 10,
      padding: [3, 18, 0, 0],
      verticalAlign: "top" as const,
    },
    axisLabel: { color: "#000000", fontSize: 10 },
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
  active = true,
  annotations = [],
  definition,
  onAddAnnotation,
  onAnnotationDraftChange,
  samples,
  showAnnotations = true,
  timeWindowS,
}: SignalPlotProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const noteInputRef = useRef<HTMLInputElement>(null);
  const [chartGeneration, setChartGeneration] = useState(0);
  const [compactLayout, setCompactLayout] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteLocation, setNoteLocation] = useState<{
    left: number;
    sample: TelemetrySample;
  } | null>(null);

  useEffect(() => {
    noteInputRef.current?.focus();
  }, [noteLocation]);

  useLayoutEffect(() => {
    const active = noteLocation !== null;
    onAnnotationDraftChange?.(definition.id, active);
    return () => {
      if (active) onAnnotationDraftChange?.(definition.id, false);
    };
  }, [definition.id, noteLocation, onAnnotationDraftChange]);

  useEffect(() => {
    if (!active) return;
    const element = elementRef.current;
    if (!element) {
      return;
    }
    let chart: echarts.ECharts | null = null;
    const resize = () => {
      if (
        !element.isConnected ||
        element.clientWidth === 0 ||
        element.clientHeight === 0
      ) {
        return;
      }
      if (!chart) {
        chart = echarts.init(element, undefined, {
          devicePixelRatio: Math.min(window.devicePixelRatio, 2),
          renderer: "canvas",
        });
        chartRef.current = chart;
        setChartGeneration((generation) => generation + 1);
      }
      if (chart.isDisposed()) return;
      const compact = element.clientWidth < 420;
      element.dataset.compactLayout = compact ? "true" : "false";
      setCompactLayout((current) => (current === compact ? current : compact));
      chart.resize();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(element);
    resize();
    return () => {
      resizeObserver.disconnect();
      chart?.dispose();
      if (chartRef.current === chart) chartRef.current = null;
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const data = signalPlotDataForDefinition(samples, definition, timeWindowS);
    const latestMs = samples.at(-1)?.tMs ?? 0;
    const startMs = latestMs - timeWindowS * 1_000;
    const visibleAnnotations = showAnnotations
      ? annotations.filter(
          (annotation) =>
            annotation.tMs >= startMs &&
            annotation.tMs <= latestMs &&
            samples.some(
              (sample) =>
                sample.source === annotation.source &&
                sample.seq === annotation.seq,
            ),
        )
      : [];
    const plotWidthPx = Math.max(
      1,
      (elementRef.current?.clientWidth ?? 43) - 42,
    );
    const annotationEdgeInsetS = timeWindowS / plotWidthPx;
    chartRef.current?.setOption(
      {
        animation: false,
        backgroundColor: "transparent",
        title: {
          left: 5,
          top: -1,
          text: signalPlotTitle(definition),
          textStyle: {
            color: "#000000",
            fontFamily: "system-ui, sans-serif",
            fontSize: 11,
            fontWeight: 600,
          },
        },
        grid: {
          left: 36,
          right: 6,
          top: compactLayout ? 31 : 18,
          bottom: 21,
        },
        legend: {
          show: false,
        },
        tooltip: {
          trigger: "axis",
          backgroundColor: "#ffffff",
          borderColor: "#737f88",
          textStyle: { color: "#000000", fontSize: 11 },
        },
        xAxis: signalXAxis(timeWindowS),
        yAxis: {
          type: "value",
          min: definition.fixedRange?.[0],
          max: definition.fixedRange?.[1],
          scale: definition.fixedRange === undefined,
          axisLabel: { color: "#000000", fontSize: 10 },
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
            width: 1.9,
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
                    color: "#000000",
                    fontSize: 10,
                    formatter: "{b}",
                    position: "insideEndTop",
                    rotate: 0,
                  },
                  data: visibleAnnotations.map((annotation) => ({
                    name: annotation.label,
                    xAxis: Math.min(
                      -annotationEdgeInsetS,
                      Math.max(
                        -timeWindowS + annotationEdgeInsetS,
                        (annotation.tMs - latestMs) / 1_000,
                      ),
                    ),
                  })),
                }
              : undefined,
        })),
      },
      { notMerge: true, lazyUpdate: true },
    );
  }, [
    active,
    annotations,
    chartGeneration,
    compactLayout,
    definition,
    samples,
    showAnnotations,
    timeWindowS,
  ]);

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
    const requestedTimeMs =
      latestMs + (-timeWindowS + fraction * timeWindowS) * 1_000;
    const nearestSample = samples.reduce((nearest, candidate) =>
      Math.abs(candidate.tMs - requestedTimeMs) <
      Math.abs(nearest.tMs - requestedTimeMs)
        ? candidate
        : nearest,
    );
    setNoteLocation({
      left: Math.min(
        Math.max(73, bounds.width - 73),
        Math.max(73, plotLeft + relative),
      ),
      sample: nearestSample,
    });
    setNoteDraft("");
  };

  const saveNote = () => {
    const label = noteDraft.trim();
    if (!label || !noteLocation || !onAddAnnotation) return;
    onAddAnnotation(noteLocation.sample, label);
    setNoteLocation(null);
    setNoteDraft("");
  };

  return (
    <div
      aria-label={`${definition.description} over the last ${timeWindowS} seconds`}
      className="signal-plot-shell"
      data-sample-count={samples.length}
      onContextMenu={(event) => {
        if (!onAddAnnotation || samples.length === 0) return;
        event.preventDefault();
        openNoteAt(event.clientX);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" && event.target === event.currentTarget) {
          event.preventDefault();
          openNoteAt();
        }
      }}
      ref={shellRef}
      role="group"
      tabIndex={onAddAnnotation && samples.length > 0 ? 0 : -1}
      title="Right-click a time to add a note."
    >
      <div
        className="signal-plot"
        data-testid={
          definition.id === "wheel-speed"
            ? "wheel-speed-plot"
            : `strip-chart-${definition.id.replace(/[^A-Za-z0-9_-]/g, "-")}`
        }
        ref={elementRef}
        role="img"
      />
      <div
        aria-hidden="true"
        className={`signal-y-unit ${compactLayout ? "compact" : ""}`}
      >
        {definition.unit}
      </div>
      <div
        aria-hidden="true"
        className={`signal-series-legend ${compactLayout ? "compact" : ""}`}
      >
        {definition.series.map((series) => (
          <span key={series.label}>
            <i
              style={
                {
                  "--series-color": series.color,
                  "--series-stroke": series.dash ?? "solid",
                } as CSSProperties
              }
            />
            {series.label}
          </span>
        ))}
      </div>
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
