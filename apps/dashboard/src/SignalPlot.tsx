import { LineChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { useEffect, useMemo, useRef } from "react";

import {
  millidegreesPerSecondToRadiansPerSecond,
  milligravityToMetersPerSecondSquared,
  type TelemetrySample,
} from "@ucsb-xrp/target";

echarts.use([
  LineChart,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
]);

export type SignalPlotId =
  "wheel-speed" | "motor-effort" | "range" | "acceleration" | "angular-rate";

interface SignalSeriesDefinition {
  label: string;
  color: string;
  dash?: "dashed" | "dotted";
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
    label: "Wheel speed",
    unit: "mm/s",
    description: "Measured left and right wheel speed",
    series: [
      {
        label: "Left",
        color: "#08736b",
        value: (sample) => sample.leftWheelSpeedMmS,
      },
      {
        label: "Right",
        color: "#a66b08",
        dash: "dashed",
        value: (sample) => sample.rightWheelSpeedMmS,
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
    id: "range",
    label: "Forward range",
    unit: "mm",
    description: "Forward time-of-flight range",
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
  const visible = samples.filter((sample) => sample.tMs >= startMs);
  return definition.series.map((series) => ({
    name: series.label,
    values: visible.map((sample) => [
      (sample.tMs - latestMs) / 1_000,
      series.value(sample),
    ]),
  }));
}

interface SignalPlotProps {
  id: SignalPlotId;
  samples: readonly TelemetrySample[];
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

export function SignalPlot({ id, samples, timeWindowS }: SignalPlotProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const definition = useMemo(() => signalPlotDefinition(id), [id]);

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
          itemHeight: 2,
          itemWidth: 11,
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
          lineStyle: {
            color: series.color,
            type: series.dash,
            width: 1.4,
          },
          data: data[index]?.values ?? [],
        })),
      },
      { notMerge: true, lazyUpdate: true },
    );
  }, [definition, id, samples, timeWindowS]);

  return (
    <div
      aria-label={`${definition.description} over the last ${timeWindowS} seconds`}
      className="signal-plot"
      data-testid={
        id === "wheel-speed" ? "wheel-speed-plot" : `strip-chart-${id}`
      }
      ref={elementRef}
      role="img"
    />
  );
}
