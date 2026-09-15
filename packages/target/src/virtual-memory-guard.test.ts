import { describe, expect, it, vi } from "vitest";
import { XrpSimulator } from "@ucsb-xrp/simulator";
import {
  VirtualMemoryGuard,
  virtualLinearMemoryBytes,
  VIRTUAL_MEMORY_STOP_BYTES,
  VIRTUAL_MEMORY_WARNING_BYTES,
} from "./virtual-memory-guard";

describe("virtual memory guard", () => {
  it("allows the measured five-minute Robot workload and warns once before stopping", () => {
    let bytes = 16 * 1024 * 1024;
    const warning = vi.fn();
    const stop = vi.fn();
    const guard = new VirtualMemoryGuard(() => bytes, warning, stop);
    guard.check();
    expect(warning).not.toHaveBeenCalled();
    bytes = Math.max(134_545_408, VIRTUAL_MEMORY_WARNING_BYTES);
    guard.check();
    guard.check();
    expect(warning).toHaveBeenCalledTimes(1);
    bytes = VIRTUAL_MEMORY_STOP_BYTES + 1024;
    expect(() => guard.check()).toThrow("Collected telemetry and notes");
    expect(guard.stopped).toBe(true);
    expect(stop).toHaveBeenCalledWith(bytes);
    expect(() => guard.check()).toThrow("start a new run");
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it("handles a one-step memory jump and permits a fresh worker after termination", () => {
    const simulator = new XrpSimulator();
    simulator.setMotorEffort("left", 0.2);
    simulator.setMotorEffort("right", 0.3);
    const stop = vi.fn(() => simulator.stop());
    const warning = vi.fn();
    const guard = new VirtualMemoryGuard(
      () => VIRTUAL_MEMORY_STOP_BYTES * 2,
      warning,
      stop,
    );
    expect(() => guard.check()).toThrow();
    expect(warning).not.toHaveBeenCalled();
    expect(simulator.state.leftEffort).toBe(0);
    expect(simulator.state.rightEffort).toBe(0);
    const next = new VirtualMemoryGuard(() => 16 * 1024 * 1024, warning, stop);
    expect(() => next.check()).not.toThrow();
    expect(next.stopped).toBe(false);
  });

  it("reads the current pinned WASM view and fails clearly on an incompatible runtime", () => {
    const runtime = { _module: { HEAPU8: new Uint8Array(16) } };
    expect(virtualLinearMemoryBytes(runtime)).toBe(16);
    runtime._module.HEAPU8 = new Uint8Array(32);
    expect(virtualLinearMemoryBytes(runtime)).toBe(32);
    expect(() => virtualLinearMemoryBytes({})).toThrow("Reload the app");
    expect(() =>
      new VirtualMemoryGuard(() => NaN, vi.fn(), vi.fn()).check(),
    ).toThrow("Invalid virtual memory measurement");
  });
});
