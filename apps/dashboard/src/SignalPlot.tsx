import * as echarts from "echarts";
import { useEffect, useRef } from "react";

import type { TelemetrySample } from "@ucsb-xrp/target";

interface SignalPlotProps {
  sample: TelemetrySample;
}

const maximumSamples = 400;

export function SignalPlot({ sample }: SignalPlotProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const history = useRef<{
    sequence: number;
    time: number[];
    left: number[];
    right: number[];
  }>({ sequence: -1, time: [], left: [], right: [] });

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
    if (sample.seq === history.current.sequence) {
      return;
    }
    if (sample.seq === 0 && history.current.sequence > 0) {
      history.current = { sequence: -1, time: [], left: [], right: [] };
    }
    const data = history.current;
    data.sequence = sample.seq;
    data.time.push(sample.tMs / 1000);
    data.left.push(sample.leftWheelSpeedMmS);
    data.right.push(sample.rightWheelSpeedMmS);
    if (data.time.length > maximumSamples) {
      data.time.shift();
      data.left.shift();
      data.right.shift();
    }

    chartRef.current?.setOption(
      {
        animation: false,
        backgroundColor: "transparent",
        grid: { left: 48, right: 18, top: 24, bottom: 36 },
        legend: {
          top: 2,
          right: 12,
          textStyle: { color: "#8fa3b4", fontSize: 10 },
          itemHeight: 2,
          itemWidth: 16,
        },
        tooltip: {
          trigger: "axis",
          backgroundColor: "#0c1924",
          borderColor: "#345066",
          textStyle: { color: "#e7eef4" },
        },
        xAxis: {
          type: "value",
          name: "time (s)",
          nameTextStyle: { color: "#768b9c" },
          axisLabel: { color: "#768b9c" },
          axisLine: { lineStyle: { color: "#345066" } },
          splitLine: { lineStyle: { color: "#172a39" } },
        },
        yAxis: {
          type: "value",
          axisLabel: { color: "#768b9c" },
          axisLine: { show: true, lineStyle: { color: "#345066" } },
          splitLine: { lineStyle: { color: "#172a39" } },
        },
        series: [
          {
            name: "Left",
            type: "line",
            showSymbol: false,
            lineStyle: { color: "#54d6c8", width: 2 },
            data: data.time.map((time, index) => [time, data.left[index]]),
          },
          {
            name: "Right",
            type: "line",
            showSymbol: false,
            lineStyle: { color: "#f5ba57", type: "dashed", width: 2 },
            data: data.time.map((time, index) => [time, data.right[index]]),
          },
        ],
      },
      { notMerge: true, lazyUpdate: true },
    );
  }, [sample]);

  return (
    <div
      aria-label="Wheel-speed history: solid cyan is left, dashed gold is right"
      className="signal-plot"
      data-testid="wheel-speed-plot"
      ref={elementRef}
      role="img"
    />
  );
}
