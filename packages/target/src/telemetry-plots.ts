import { MAX_RUNTIME_PLOTS, parseRuntimeState } from "./runtime-controls";
import type { RuntimePlot } from "./types";

function invalid(): never {
  throw new Error("Sample plot values or descriptors are malformed");
}
function parse(plots: unknown): RuntimePlot[] {
  return parseRuntimeState(
    JSON.stringify({ revision: 0, parameters: [], watches: [], plots }),
  ).plots;
}

/** Decode sample-specific values; absent rows remain absent rather than using latest runtime state. */
export function decodeSamplePlots(
  rows: unknown,
  descriptors: unknown,
  sampleCount: number,
): RuntimePlot[][] | null {
  if (rows === undefined || (rows === null && sampleCount === 0)) return null;
  if (!Array.isArray(rows) || rows.length !== sampleCount) invalid();
  let table: RuntimePlot[] | null = null;
  if (descriptors !== undefined) {
    if (!Array.isArray(descriptors) || descriptors.length > 256) invalid();
    table = descriptors.map((value) => {
      if (!value || typeof value !== "object" || Array.isArray(value))
        invalid();
      return parse([{ ...value, value: 0 }])[0]!;
    });
  }
  return rows.map((row) => {
    if (row === null) return [];
    if (!Array.isArray(row) || row.length > MAX_RUNTIME_PLOTS) invalid();
    if (table !== null && row.every(Array.isArray)) {
      const decoded = row.map((pair) => {
        if (
          pair.length !== 2 ||
          !Number.isSafeInteger(pair[0]) ||
          pair[0] < 0 ||
          pair[0] >= table!.length ||
          typeof pair[1] !== "number" ||
          !Number.isFinite(pair[1])
        )
          invalid();
        return { ...table![pair[0]]!, value: pair[1] };
      });
      return parse(decoded);
    }
    return parse(row);
  });
}
