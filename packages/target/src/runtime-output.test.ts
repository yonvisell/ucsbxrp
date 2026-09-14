import { describe, expect, it } from "vitest";
import { RuntimeOutput, type RuntimeOutputLine } from "./runtime-output";
import { RetainedRun } from "./retained-run";

describe("bounded runtime output and retained run identity", () => {
  it("bounds synchronous output floods and reports every omitted line", () => {
    let now = 0;
    const batches: { lines: RuntimeOutputLine[]; omitted: number }[] = [];
    const output = new RuntimeOutput(
      (lines, omitted) => batches.push({ lines, omitted }),
      () => now,
    );
    for (let i = 0; i < 100000; i++) output.write("stdout", String(i));
    output.flush();
    expect(batches.flatMap((batch) => batch.lines)).toHaveLength(20);
    expect(batches.reduce((sum, batch) => sum + batch.omitted, 0)).toBe(99980);
    now = 100;
    output.write("stderr", "last error");
    output.flush();
    expect(batches.at(-1)?.lines[0]?.line).toBe("last error");
  });
  it("retains an error milestone even when stdout already used the output allowance", () => {
    const lines: RuntimeOutputLine[] = [];
    const output = new RuntimeOutput(
      (batch) => lines.push(...batch),
      () => 0,
    );
    for (let i = 0; i < 1000; i++) output.write("stdout", String(i));
    output.write("stderr", "Required error detail");
    expect(lines).toContainEqual({
      stream: "stderr",
      line: "Required error detail",
    });
    expect(lines.length).toBeLessThanOrEqual(24);
  });
  it("retains lifecycle and source identity after all starting output is discarded", () => {
    const run = new RetainedRun();
    run.observe({
      type: "run",
      phase: "begin",
      runId: "r1",
      startedAtMs: 1,
      state: "running",
      detail: "Running",
      projectId: "project-a",
      projectRevision: "sha-a",
    });
    for (let i = 0; i < 2500; i++) {
      run.observe({ type: "console", stream: "stdout", line: String(i) });
      run.discardedOutput();
    }
    run.observe({ type: "status", state: "ready", detail: "Completed" });
    run.observe({
      type: "run",
      phase: "end",
      runId: "r1",
      startedAtMs: 1,
      state: "ready",
      detail: "Completed",
      projectId: "project-a",
      projectRevision: "sha-a",
      finishedAtMs: 3,
    });
    expect(run.snapshot()).toMatchObject({
      runId: "r1",
      projectId: "project-a",
      projectRevision: "sha-a",
      droppedOutputLines: 2500,
      finishedAtMs: expect.any(Number),
    });
  });
});
