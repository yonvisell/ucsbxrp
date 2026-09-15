const MIB = 1024 * 1024;
export const VIRTUAL_MEMORY_WARNING_BYTES = 96 * MIB;
export const VIRTUAL_MEMORY_STOP_BYTES = 192 * MIB;

/** Pinned PyScript runtime boundary: read memory only; never re-enter Python. */
export function virtualLinearMemoryBytes(runtime: unknown): number {
  const heap = (runtime as { _module?: { HEAPU8?: Uint8Array } })?._module
    ?.HEAPU8;
  if (!(heap instanceof Uint8Array) || heap.buffer.byteLength < 1) {
    throw new Error(
      "Virtual runtime memory accounting is unavailable. Reload the app before running.",
    );
  }
  return heap.buffer.byteLength;
}

export function virtualMemoryStopDetail(bytes: number): string {
  return `Virtual run stopped at ${Math.ceil(bytes / MIB)} MiB to keep the browser responsive. Collected telemetry and notes remain available in the Monitor. Wait for its save status, then export data or start a new run. Use shorter runs or allocate fewer temporary objects.`;
}

/** A fresh worker gets a fresh budget. Physical execution never uses this guard. */
export class VirtualMemoryGuard {
  stopped = false;
  peakBytes = 0;
  private warned = false;

  constructor(
    private readonly bytes: () => number,
    private readonly warning: (bytes: number) => void,
    private readonly stop: (bytes: number) => void,
    private readonly warningBytes = VIRTUAL_MEMORY_WARNING_BYTES,
    private readonly stopBytes = VIRTUAL_MEMORY_STOP_BYTES,
  ) {
    if (
      !Number.isFinite(warningBytes) ||
      !Number.isFinite(stopBytes) ||
      warningBytes <= 0 ||
      stopBytes <= warningBytes
    )
      throw new Error("Invalid virtual memory limits");
  }

  check(): void {
    if (this.stopped) throw new Error(virtualMemoryStopDetail(this.peakBytes));
    const bytes = this.bytes();
    if (!Number.isSafeInteger(bytes) || bytes <= 0)
      throw new Error("Invalid virtual memory measurement");
    this.peakBytes = Math.max(bytes, this.peakBytes);
    if (bytes >= this.stopBytes) {
      this.stopped = true;
      this.stop(bytes);
      throw new Error(virtualMemoryStopDetail(bytes));
    }
    if (!this.warned && bytes >= this.warningBytes) {
      this.warned = true;
      this.warning(bytes);
    }
  }
}
