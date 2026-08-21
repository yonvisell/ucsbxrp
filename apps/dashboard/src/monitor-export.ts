import {
  SIMULATION_SCENARIOS,
  type SimulationScenario,
  type TelemetrySample,
} from "@ucsb-xrp/target";

import {
  signalPlotDataForDefinition,
  signalPlotDefinition,
  type SignalPlotDefinition,
  type SignalPlotId,
} from "./SignalPlot";

export interface MonitorAnnotation {
  id: string;
  label: string;
  tMs: number;
  poseAvailable: boolean;
  xMm: number;
  yMm: number;
}

const WORLD_WIDTH_MM = 2_400;
const WORLD_HEIGHT_MM = 1_800;
const XRP_LENGTH_MM = 192.5;
const XRP_WIDTH_MM = 190.5;

function xml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function plotBounds(
  values: readonly (number | null)[],
  fixedRange?: readonly [number, number],
): readonly [number, number] {
  if (fixedRange) return fixedRange;
  const finite = values.filter(
    (value): value is number => value !== null && Number.isFinite(value),
  );
  if (finite.length === 0) return [-1, 1];
  const minimum = Math.min(...finite);
  const maximum = Math.max(...finite);
  if (minimum === maximum) {
    const padding = Math.max(1, Math.abs(minimum) * 0.1);
    return [minimum - padding, maximum + padding];
  }
  const padding = (maximum - minimum) * 0.08;
  return [minimum - padding, maximum + padding];
}

function numberLabel(value: number): string {
  const absolute = Math.abs(value);
  if (absolute >= 100) return value.toFixed(0);
  if (absolute >= 10) return value.toFixed(1).replace(/\.0$/, "");
  return value
    .toFixed(2)
    .replace(/\.00$/, "")
    .replace(/(\.\d)0$/, "$1");
}

export function createSignalPlotsSvg(
  samples: readonly TelemetrySample[],
  plots: readonly (SignalPlotId | SignalPlotDefinition)[],
  timeWindowS: number,
  annotations: readonly MonitorAnnotation[] = [],
): string {
  if (plots.length === 0) {
    throw new Error("Choose at least one signal before exporting plots.");
  }
  const width = 1_200;
  const sectionHeight = 240;
  const height = sectionHeight * plots.length;
  const left = 62;
  const right = 18;
  const top = 34;
  const bottom = 34;
  const plotWidth = width - left - right;
  const plotHeight = sectionHeight - top - bottom;
  const latestMs = samples.at(-1)?.tMs ?? 0;
  const startMs = latestMs - timeWindowS * 1_000;
  const body: string[] = [];

  plots.forEach((plot, plotIndex) => {
    const definition =
      typeof plot === "string" ? signalPlotDefinition(plot) : plot;
    const seriesData = signalPlotDataForDefinition(
      samples,
      definition,
      timeWindowS,
    );
    const sectionY = plotIndex * sectionHeight;
    const chartTop = sectionY + top;
    const allValues = seriesData.flatMap((series) =>
      series.values.map(([, value]) => value),
    );
    const [minimum, maximum] = plotBounds(allValues, definition.fixedRange);
    const x = (seconds: number) =>
      left + ((seconds + timeWindowS) / timeWindowS) * plotWidth;
    const y = (value: number) =>
      chartTop +
      plotHeight -
      ((value - minimum) / (maximum - minimum)) * plotHeight;

    body.push(
      `<rect x="0" y="${sectionY}" width="${width}" height="${sectionHeight}" fill="#fff"/>`,
      `<text x="8" y="${sectionY + 17}" class="title">${xml(definition.label)} · ${xml(definition.unit)}</text>`,
    );
    for (let tick = 0; tick <= 4; tick += 1) {
      const value = minimum + ((maximum - minimum) * tick) / 4;
      const tickY = y(value);
      body.push(
        `<line x1="${left}" y1="${tickY}" x2="${width - right}" y2="${tickY}" class="grid major"/>`,
        `<text x="${left - 7}" y="${tickY + 3}" text-anchor="end" class="axis">${xml(numberLabel(value))}</text>`,
      );
    }
    for (let tick = 0; tick <= 5; tick += 1) {
      const seconds = -timeWindowS + (timeWindowS * tick) / 5;
      const tickX = x(seconds);
      body.push(
        `<line x1="${tickX}" y1="${chartTop}" x2="${tickX}" y2="${chartTop + plotHeight}" class="grid major"/>`,
        `<text x="${tickX}" y="${chartTop + plotHeight + 16}" text-anchor="middle" class="axis">${xml(numberLabel(seconds))}</text>`,
      );
      if (tick < 5) {
        const minorX = x(seconds + timeWindowS / 10);
        body.push(
          `<line x1="${minorX}" y1="${chartTop}" x2="${minorX}" y2="${chartTop + plotHeight}" class="grid minor"/>`,
        );
      }
    }
    body.push(
      `<line x1="${left}" y1="${chartTop}" x2="${left}" y2="${chartTop + plotHeight}" class="axis-line"/>`,
      `<line x1="${left}" y1="${chartTop + plotHeight}" x2="${width - right}" y2="${chartTop + plotHeight}" class="axis-line"/>`,
      `<text x="${width - right}" y="${chartTop + plotHeight + 29}" text-anchor="end" class="axis">time (s)</text>`,
    );

    const visibleAnnotations = annotations.filter(
      (annotation) => annotation.tMs >= startMs && annotation.tMs <= latestMs,
    );
    for (const [annotationIndex, annotation] of visibleAnnotations.entries()) {
      const annotationX = x((annotation.tMs - latestMs) / 1_000);
      const label = `${(annotation.tMs / 1_000).toFixed(2)} s · ${annotation.label}`;
      body.push(
        `<line x1="${annotationX}" y1="${chartTop}" x2="${annotationX}" y2="${chartTop + plotHeight}" class="annotation"/>`,
        `<text x="${Math.min(annotationX + 4, width - 230)}" y="${chartTop + 11 + (annotationIndex % 3) * 11}" class="note">${xml(label)}</text>`,
      );
    }

    definition.series.forEach((series, seriesIndex) => {
      const values = seriesData[seriesIndex]?.values ?? [];
      let path = "";
      let active = false;
      for (const [seconds, value] of values) {
        if (value === null || !Number.isFinite(value)) {
          active = false;
          continue;
        }
        path += `${active ? "L" : "M"}${x(seconds).toFixed(2)},${y(value).toFixed(2)} `;
        active = true;
      }
      body.push(
        `<path d="${path.trim()}" fill="none" stroke="${series.color}" stroke-width="2"${
          series.dash === "dashed"
            ? ' stroke-dasharray="8 5"'
            : series.dash === "dotted"
              ? ' stroke-dasharray="2 4"'
              : ""
        }/>`,
      );
      const legendX =
        width - right - (definition.series.length - seriesIndex) * 84;
      body.push(
        `<line x1="${legendX}" y1="${sectionY + 14}" x2="${legendX + 18}" y2="${sectionY + 14}" stroke="${series.color}" stroke-width="2"/>`,
        `<text x="${legendX + 23}" y="${sectionY + 17}" class="legend">${xml(series.label)}</text>`,
      );
    });
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">UCSBXRP signal plots</title>
  <desc id="description">${plots.length} signal histories over ${timeWindowS} seconds</desc>
  <style>
    text { font-family: system-ui, -apple-system, sans-serif; fill: #17232b; }
    .title { font-size: 14px; font-weight: 650; }
    .axis, .legend { font-size: 11px; fill: #56636c; }
    .note { font-size: 10px; font-weight: 600; fill: #75434d; paint-order: stroke; stroke: #fff; stroke-width: 3px; }
    .grid { stroke-width: 1; }
    .grid.major { stroke: #d5dadd; }
    .grid.minor { stroke: #eceff0; }
    .axis-line { stroke: #737f88; stroke-width: 1; }
    .annotation { stroke: #87515d; stroke-width: 1.2; stroke-dasharray: 4 3; }
  </style>
  ${body.join("\n  ")}
</svg>`;
}

export function timestampedName(prefix: string, extension: string): string {
  return `${prefix}-${new Date().toISOString().replaceAll(":", "-")}.${extension}`;
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function svgToPng(svg: string, scale = 2): Promise<Blob> {
  const dimensions = svg.match(/width="(\d+)" height="(\d+)"/);
  if (!dimensions) throw new Error("The plot export has no dimensions.");
  const width = Number(dimensions[1]);
  const height = Number(dimensions[2]);
  const source = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(source);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("PNG export is unavailable in this browser.");
    context.scale(scale, scale);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("PNG encoding failed.")),
        "image/png",
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export interface WorldReplayPlan {
  readonly firstMs: number;
  readonly lastMs: number;
  readonly durationMs: number;
  readonly playbackRate: number;
  readonly frameCount: number;
  readonly framesPerSecond: number;
}

function latestPoseSegment(
  samples: readonly TelemetrySample[],
): TelemetrySample[] {
  const poses = samples.filter((sample) => sample.poseAvailable);
  let start = 0;
  for (let index = 1; index < poses.length; index += 1) {
    if (
      poses[index]!.source !== poses[index - 1]!.source ||
      poses[index]!.tMs < poses[index - 1]!.tMs
    ) {
      start = index;
    }
  }
  return poses.slice(start);
}

export function worldReplayPlan(
  samples: readonly TelemetrySample[],
  maximumOutputSeconds = 20,
  framesPerSecond = 30,
): WorldReplayPlan {
  const poses = latestPoseSegment(samples);
  if (poses.length === 0) {
    throw new Error("The recording contains no published robot pose.");
  }
  const firstMs = poses[0]!.tMs;
  const lastMs = poses.at(-1)!.tMs;
  const durationMs = Math.max(0, lastMs - firstMs);
  const playbackRate = Math.max(
    1,
    durationMs / Math.max(1, maximumOutputSeconds * 1_000),
  );
  const outputSeconds = Math.max(
    1 / framesPerSecond,
    durationMs / 1_000 / playbackRate,
  );
  return {
    firstMs,
    lastMs,
    durationMs,
    playbackRate,
    frameCount: Math.max(1, Math.ceil(outputSeconds * framesPerSecond) + 1),
    framesPerSecond,
  };
}

function drawWorldFrame(
  context: CanvasRenderingContext2D,
  samples: readonly TelemetrySample[],
  currentIndex: number,
  annotations: readonly MonitorAnnotation[],
  scenario: SimulationScenario,
  plan: WorldReplayPlan,
): void {
  const canvas = context.canvas;
  const width = canvas.width;
  const height = canvas.height;
  const x = (worldX: number) =>
    ((worldX + WORLD_WIDTH_MM / 2) / WORLD_WIDTH_MM) * width;
  const y = (worldY: number) =>
    height - ((worldY + WORLD_HEIGHT_MM / 2) / WORLD_HEIGHT_MM) * height;
  const xScale = width / WORLD_WIDTH_MM;
  const yScale = height / WORLD_HEIGHT_MM;
  const sample = samples[currentIndex]!;

  context.fillStyle = "#eef1f2";
  context.fillRect(0, 0, width, height);
  context.lineWidth = 1;
  for (let value = -1_200; value <= 1_200; value += 100) {
    context.strokeStyle = value % 500 === 0 ? "#aeb8bd" : "#d5dadd";
    context.beginPath();
    context.moveTo(x(value), 0);
    context.lineTo(x(value), height);
    context.stroke();
  }
  for (let value = -900; value <= 900; value += 100) {
    context.strokeStyle = value % 500 === 0 ? "#aeb8bd" : "#d5dadd";
    context.beginPath();
    context.moveTo(0, y(value));
    context.lineTo(width, y(value));
    context.stroke();
  }
  context.strokeStyle = "#596a73";
  context.lineWidth = 2;
  context.strokeRect(1, 1, width - 2, height - 2);

  for (const obstacle of SIMULATION_SCENARIOS[scenario].obstacles) {
    context.fillStyle = "#a7423c";
    context.fillRect(
      x(obstacle.minimumXmm),
      y(obstacle.maximumYmm),
      (obstacle.maximumXmm - obstacle.minimumXmm) * xScale,
      (obstacle.maximumYmm - obstacle.minimumYmm) * yScale,
    );
  }

  context.strokeStyle = "#006c64";
  context.lineWidth = 3;
  context.beginPath();
  let pathStarted = false;
  for (let index = 0; index <= currentIndex; index += 1) {
    const pose = samples[index]!;
    if (!pose.poseAvailable) continue;
    if (pathStarted) context.lineTo(x(pose.xMm), y(pose.yMm));
    else context.moveTo(x(pose.xMm), y(pose.yMm));
    pathStarted = true;
  }
  context.stroke();

  if (sample.rangeMm !== null) {
    const sensorX =
      sample.xMm + (XRP_LENGTH_MM / 2) * Math.cos(sample.headingRad);
    const sensorY =
      sample.yMm + (XRP_LENGTH_MM / 2) * Math.sin(sample.headingRad);
    context.strokeStyle = "#765000";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x(sensorX), y(sensorY));
    context.lineTo(
      x(sensorX + sample.rangeMm * Math.cos(sample.headingRad)),
      y(sensorY + sample.rangeMm * Math.sin(sample.headingRad)),
    );
    context.stroke();
  }

  context.save();
  context.translate(x(sample.xMm), y(sample.yMm));
  context.rotate(-sample.headingRad);
  context.fillStyle = "#68747b";
  context.fillRect(
    (-XRP_LENGTH_MM / 2) * xScale,
    (-XRP_WIDTH_MM / 2) * yScale,
    XRP_LENGTH_MM * xScale,
    XRP_WIDTH_MM * yScale,
  );
  context.fillStyle = "#20262a";
  context.fillRect(-48 * xScale, -103 * yScale, 60 * xScale, 18 * yScale);
  context.fillRect(-48 * xScale, 85 * yScale, 60 * xScale, 18 * yScale);
  context.fillStyle = "#b83b35";
  context.fillRect(-20 * xScale, -27 * yScale, 64 * xScale, 54 * yScale);
  context.fillStyle = "#003660";
  context.beginPath();
  context.moveTo(110 * xScale, 0);
  context.lineTo(88 * xScale, -10 * yScale);
  context.lineTo(88 * xScale, 10 * yScale);
  context.closePath();
  context.fill();
  context.restore();

  context.font = "600 13px system-ui, sans-serif";
  for (const annotation of annotations) {
    if (
      !annotation.poseAvailable ||
      annotation.tMs > sample.tMs ||
      annotation.tMs < plan.firstMs
    ) {
      continue;
    }
    const annotationX = x(annotation.xMm);
    const annotationY = y(annotation.yMm);
    const label = `${(annotation.tMs / 1_000).toFixed(2)} s · ${annotation.label.slice(0, 42)}`;
    context.fillStyle = "#87515d";
    context.beginPath();
    context.arc(annotationX, annotationY, 4, 0, Math.PI * 2);
    context.fill();
    const textWidth = context.measureText(label).width;
    const labelX = Math.min(annotationX + 7, width - textWidth - 8);
    const labelY = Math.max(16, annotationY - 7);
    context.fillStyle = "rgba(255,255,255,0.9)";
    context.fillRect(labelX - 2, labelY - 12, textWidth + 4, 16);
    context.fillStyle = "#75434d";
    context.fillText(label, labelX, labelY);
  }

  context.fillStyle = "rgba(255,255,255,0.88)";
  context.fillRect(8, 8, 205, 44);
  context.fillStyle = "#17232b";
  context.font = "650 16px system-ui, sans-serif";
  context.fillText("UCSBXRP world replay", 14, 27);
  context.font = "12px system-ui, sans-serif";
  context.fillStyle = "#56636c";
  context.fillText(
    `t = ${(sample.tMs / 1_000).toFixed(2)} s · ${plan.playbackRate.toFixed(1)}×`,
    14,
    44,
  );
}

function supportedWebmType(): string {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("WebM export is unavailable in this browser.");
  }
  for (const type of [
    "video/webm;codecs=vp8",
    "video/webm;codecs=vp9",
    "video/webm",
  ]) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  throw new Error("This browser does not provide a WebM video encoder.");
}

export function webmExportSupported(): boolean {
  return (
    typeof MediaRecorder !== "undefined" &&
    "captureStream" in HTMLCanvasElement.prototype &&
    ["video/webm;codecs=vp8", "video/webm;codecs=vp9", "video/webm"].some(
      (type) => MediaRecorder.isTypeSupported(type),
    )
  );
}

export async function createWorldReplayWebm(options: {
  samples: readonly TelemetrySample[];
  annotations?: readonly MonitorAnnotation[];
  scenario: SimulationScenario;
  onProgress?: (fraction: number) => void;
  maximumOutputSeconds?: number;
}): Promise<Blob> {
  const samples = latestPoseSegment(options.samples);
  const plan = worldReplayPlan(samples, options.maximumOutputSeconds);
  const replaySamples: TelemetrySample[] = [];
  let sourceIndex = 0;
  for (let frame = 0; frame < plan.frameCount; frame += 1) {
    const fraction = plan.frameCount === 1 ? 1 : frame / (plan.frameCount - 1);
    const targetMs = plan.firstMs + fraction * plan.durationMs;
    while (
      sourceIndex + 1 < samples.length &&
      samples[sourceIndex + 1]!.tMs <= targetMs
    ) {
      sourceIndex += 1;
    }
    replaySamples.push(samples[sourceIndex]!);
  }
  const canvas = document.createElement("canvas");
  canvas.width = 960;
  canvas.height = 720;
  const context = canvas.getContext("2d");
  if (!context || !("captureStream" in canvas)) {
    throw new Error("Canvas video export is unavailable in this browser.");
  }
  const stream = canvas.captureStream(0);
  const videoTrack = stream.getVideoTracks()[0] as MediaStreamTrack & {
    requestFrame?: () => void;
  };
  if (!videoTrack) throw new Error("The browser did not create a video track.");
  const recorder = new MediaRecorder(stream, {
    mimeType: supportedWebmType(),
    videoBitsPerSecond: 3_000_000,
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };
  const completed = new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error("WebM encoding failed."));
    recorder.onstop = () =>
      resolve(new Blob(chunks, { type: recorder.mimeType || "video/webm" }));
  });
  const started = new Promise<void>((resolve, reject) => {
    recorder.addEventListener("start", () => resolve(), { once: true });
    recorder.addEventListener(
      "error",
      () => reject(new Error("The WebM encoder did not start.")),
      { once: true },
    );
  });
  recorder.start(250);
  try {
    for (let frame = 0; frame < plan.frameCount; frame += 1) {
      drawWorldFrame(
        context,
        replaySamples,
        frame,
        options.annotations ?? [],
        options.scenario,
        plan,
      );
      videoTrack.requestFrame?.();
      if (frame === 0) await started;
      options.onProgress?.((frame + 1) / plan.frameCount);
      await new Promise((resolve) =>
        window.setTimeout(resolve, 1_000 / plan.framesPerSecond),
      );
    }
  } finally {
    recorder.stop();
  }
  const blob = await completed.finally(() =>
    stream.getTracks().forEach((track) => track.stop()),
  );
  if (blob.size === 0) throw new Error("The browser produced an empty video.");
  return blob;
}
