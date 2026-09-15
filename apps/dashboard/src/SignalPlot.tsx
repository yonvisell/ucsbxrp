import { LineChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TooltipComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import {
  millidegreesPerSecondToRadiansPerSecond,
  milligravityToMetersPerSecondSquared,
  type RuntimePlot,
  type TelemetrySample,
} from "@ucsb-xrp/target";

import type { MonitorAnnotation } from "./monitor-export-core";
import {
  retainedVisibleAnnotations,
  nearestObservation,
  observationDescription,
  inspectionValue,
  escapeInspectionHtml,
} from "./monitor-inspection";
import { normalizeUltrasoundRangeMm } from "./ultrasound-range";

echarts.use([
  LineChart,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
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
  target?: boolean;
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
    label: "Wheel speeds",
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
        target: true,
        value: (sample) => sample.targetLeftWheelSpeedMmS ?? null,
      },
      {
        label: "target v_R",
        color: "#87515d",
        dash: "dotted",
        target: true,
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
    title: "Drive command",
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
        value: (sample) => normalizeUltrasoundRangeMm(sample.rangeMm),
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

export function withTargetSeriesVisibility(
  definition: SignalPlotDefinition,
  showTargetValues: boolean,
): SignalPlotDefinition {
  if (showTargetValues || !definition.series.some((series) => series.target)) {
    return definition;
  }
  return {
    ...definition,
    series: definition.series.filter((series) => !series.target),
  };
}

export function runtimePlotDefinition(plot: RuntimePlot): SignalPlotDefinition {
  return {
    id: `program:${plot.name}`,
    label: plot.label,
    axisLabel: plot.name,
    unit: plot.unit || "unitless",
    description: `${plot.label} in ${plot.unit || "unitless values"}. Values recorded with another unit remain in the CSV.`,
    series: [
      {
        label: plot.label,
        color: "#08736b",
        value: (sample) =>
          sample.plotValues?.find(
            (value) =>
              value.name === plot.name &&
              (value.unit ?? "") === (plot.unit ?? ""),
          )?.value ?? null,
      },
    ],
  };
}

export const SIGNAL_PLOT_LEFT = 36;
export const SIGNAL_PLOT_RIGHT = 6;

export function signalInspectionHtml(
  sample: TelemetrySample,
  definition: SignalPlotDefinition,
): string {
  const rows = definition.series.map((series) => {
    const value = inspectionValue(series.value(sample));
    return `<div class="signal-inspection-row"><span>${escapeInspectionHtml(series.label)}</span><strong>${escapeInspectionHtml(value)}${value === "Unavailable" || definition.unit === "unitless" || definition.unit === "−1…+1" ? "" : ` ${escapeInspectionHtml(definition.unit)}`}</strong></div>`;
  });
  return `<div class="signal-inspection"><strong>${escapeInspectionHtml(observationDescription(sample))}</strong>${rows.join("")}</div>`;
}

export function signalPlotTitle(definition: SignalPlotDefinition): string {
  return definition.title ?? definition.label;
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
  onRequestAnnotation?: (sample: TelemetrySample) => void;
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
  onRequestAnnotation,
  samples,
  showAnnotations = true,
  timeWindowS,
}: SignalPlotProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const hoveredSampleRef = useRef<TelemetrySample | null>(null);
  const [inspection, setInspection] = useState<{
    sample: TelemetrySample;
    left: number;
    width: number;
  } | null>(null);
  const [chartGeneration, setChartGeneration] = useState(0);
  const [compactLayout, setCompactLayout] = useState(false);
  const [headingHeight, setHeadingHeight] = useState(20);
  const [inspectionAnnouncement, setInspectionAnnouncement] = useState("");

  useEffect(() => {
    const selected = hoveredSampleRef.current;
    if (
      selected &&
      !samples.some(
        (sample) =>
          sample.source === selected.source &&
          (selected.observationSeq === undefined
            ? sample.seq === selected.seq && sample.tMs === selected.tMs
            : sample.observationSeq === selected.observationSeq),
      )
    ) {
      hoveredSampleRef.current = null;
      setInspection(null);
    }
  }, [samples]);

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
      setHeadingHeight(headingRef.current?.offsetHeight ?? 20);
      chart.resize();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(element);
    if (headingRef.current) resizeObserver.observe(headingRef.current);
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
      ? retainedVisibleAnnotations(annotations, samples, startMs, latestMs)
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
        grid: {
          left: SIGNAL_PLOT_LEFT,
          right: SIGNAL_PLOT_RIGHT,
          top: headingHeight + 3,
          bottom: 21,
        },
        legend: {
          show: false,
        },
        tooltip: {
          // Inspection belongs to the selected observation, not the chart's
          // changing data index. Keep it outside ECharts' live repaint cycle.
          show: false,
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
          symbol: "none",
          emphasis: { scale: false, disabled: true },
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
                    name: String(annotations.indexOf(annotation) + 1),
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
    headingHeight,
    definition,
    samples,
    showAnnotations,
    timeWindowS,
  ]);

  const observationAt = (clientX?: number) => {
    const shell = shellRef.current;
    const latestMs = samples.at(-1)?.tMs;
    if (!shell || latestMs === undefined) return null;
    const bounds = shell.getBoundingClientRect();
    const width = Math.max(
      1,
      bounds.width - SIGNAL_PLOT_LEFT - SIGNAL_PLOT_RIGHT,
    );
    const fraction =
      clientX === undefined
        ? 1
        : Math.min(
            1,
            Math.max(0, (clientX - bounds.left - SIGNAL_PLOT_LEFT) / width),
          );
    return nearestObservation(
      samples,
      latestMs + (-timeWindowS + fraction * timeWindowS) * 1_000,
    );
  };

  const showInspection = (selected: TelemetrySample, clientX?: number) => {
    const shell = shellRef.current;
    if (!shell) return;
    const bounds = shell.getBoundingClientRect();
    const width = Math.min(
      280,
      Math.max(1, bounds.width - SIGNAL_PLOT_LEFT - SIGNAL_PLOT_RIGHT),
    );
    hoveredSampleRef.current = selected;
    setInspection({
      sample: selected,
      width,
      left: Math.max(
        SIGNAL_PLOT_LEFT,
        Math.min(
          (clientX === undefined ? SIGNAL_PLOT_LEFT : clientX - bounds.left) +
            10,
          bounds.width - SIGNAL_PLOT_RIGHT - width,
        ),
      ),
    });
  };

  const openNoteAt = (clientX?: number) => {
    if (!onRequestAnnotation) return;
    const nearest = observationAt(clientX);
    const hovered = hoveredSampleRef.current;
    const selected =
      hovered && (clientX === undefined || hovered.tMs === nearest?.tMs)
        ? hovered
        : nearest;
    if (selected) onRequestAnnotation(selected);
  };

  const moveInspection = (direction: number) => {
    const latestMs = samples.at(-1)?.tMs ?? 0;
    const visible = samples.filter(
      (sample) => sample.tMs >= latestMs - timeWindowS * 1_000,
    );
    if (!visible.length) return;
    const current = hoveredSampleRef.current;
    const currentIndex = current
      ? visible.findIndex(
          (candidate) =>
            candidate.source === current.source &&
            (current.observationSeq === undefined
              ? candidate.seq === current.seq && candidate.tMs === current.tMs
              : candidate.observationSeq === current.observationSeq),
        )
      : visible.length - 1;
    const index = Math.max(
      0,
      Math.min(visible.length - 1, currentIndex + direction),
    );
    const selected = visible[index]!;
    showInspection(selected);
    setInspectionAnnouncement(
      `${observationDescription(selected)}. ${definition.series.map((series) => `${series.label}: ${inspectionValue(series.value(selected))} ${definition.unit}`).join(". ")}`,
    );
  };

  return (
    <div
      aria-label={`${definition.description} over the last ${timeWindowS} seconds`}
      className="signal-plot-shell"
      data-sample-count={samples.length}
      onContextMenu={(event) => {
        if (!onRequestAnnotation || samples.length === 0) return;
        event.preventDefault();
        openNoteAt(event.clientX);
      }}
      onMouseMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - bounds.left;
        const y = event.clientY - bounds.top;
        if (
          x < SIGNAL_PLOT_LEFT ||
          x > bounds.width - SIGNAL_PLOT_RIGHT ||
          y < headingHeight + 3 ||
          y > bounds.height - 21
        ) {
          setInspection(null);
          return;
        }
        const selected = observationAt(event.clientX);
        if (selected) showInspection(selected, event.clientX);
      }}
      onMouseLeave={() => setInspection(null)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setInspection(null);
      }}
      onKeyDown={(event) => {
        if (
          event.target === event.currentTarget &&
          ["ArrowLeft", "ArrowRight"].includes(event.key)
        ) {
          event.preventDefault();
          moveInspection(event.key === "ArrowLeft" ? -1 : 1);
        }
        if (event.key === "Enter" && event.target === event.currentTarget) {
          event.preventDefault();
          openNoteAt();
        }
      }}
      ref={shellRef}
      role="group"
      tabIndex={samples.length > 0 ? 0 : -1}
      title="Hover to inspect. Left and right arrow keys select individual observations; Enter or right-click adds a note."
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
      <div aria-hidden="true" className="signal-y-unit">
        {definition.unit}
      </div>
      {inspection ? (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            zIndex: 3,
            top: headingHeight + 6,
            left: inspection.left,
            width: inspection.width,
            padding: "5px 7px",
            background: "var(--panel)",
            border: "1px solid var(--line-bright)",
            color: "var(--ink)",
            pointerEvents: "none",
          }}
          dangerouslySetInnerHTML={{
            __html: signalInspectionHtml(inspection.sample, definition),
          }}
        />
      ) : null}
      <div className="signal-plot-heading" ref={headingRef}>
        <strong title={definition.description}>
          {signalPlotTitle(definition)}
        </strong>
        {definition.series.length > 1 ? (
          <div
            className={`signal-series-legend ${compactLayout ? "compact" : ""}`}
          >
            {definition.series.map((series) => (
              <span key={series.label}>
                <i
                  aria-hidden="true"
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
        ) : null}
        {onRequestAnnotation ? (
          <button
            className="plot-add-note"
            aria-label={`Add note to ${definition.label}`}
            onClick={() => openNoteAt()}
            type="button"
          >
            Note
          </button>
        ) : null}
      </div>
      <span className="visually-hidden" aria-live="polite">
        {inspectionAnnouncement}
      </span>
    </div>
  );
}
