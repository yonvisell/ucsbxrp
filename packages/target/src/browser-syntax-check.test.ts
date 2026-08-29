import { afterEach, describe, expect, it, vi } from "vitest";

import {
  BROWSER_SYNTAX_CHECK_TIMEOUT_MS,
  checkCourseProjectSyntax,
} from "./browser-syntax-check";
import type { PythonDiagnostic } from "./types";
import { VirtualTargetClient } from "./virtual-target";
import type {
  RuntimeWorkerMessage,
  RuntimeWorkerRequest,
} from "./worker-protocol";

const project = {
  entrypoint: "main.py",
  files: { "main.py": "def broken:" },
};

type WorkerMessageHandler = (event: MessageEvent<RuntimeWorkerMessage>) => void;

class FakeWorker {
  static instance: FakeWorker | null = null;

  onmessage: WorkerMessageHandler | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: ((event: MessageEvent) => void) | null = null;
  readonly terminate = vi.fn();
  readonly posted: RuntimeWorkerRequest[] = [];

  constructor(readonly respond: (worker: FakeWorker) => void = () => {}) {
    FakeWorker.instance = this;
  }

  postMessage(message: RuntimeWorkerRequest): void {
    this.posted.push(message);
    queueMicrotask(() => this.respond(this));
  }

  emit(message: RuntimeWorkerMessage): void {
    this.onmessage?.({ data: message } as MessageEvent<RuntimeWorkerMessage>);
  }
}

function installWorker(
  respond: (worker: FakeWorker) => void,
): typeof FakeWorker {
  class InstalledWorker extends FakeWorker {
    constructor() {
      super(respond);
    }
  }
  vi.stubGlobal("Worker", InstalledWorker);
  return InstalledWorker;
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  FakeWorker.instance = null;
});

describe("standalone browser syntax checking", () => {
  it("propagates worker diagnostics and bounded console output", async () => {
    const diagnostic: PythonDiagnostic = {
      source: "micropython",
      phase: "compile",
      severity: "error",
      code: "SyntaxError",
      message: "invalid syntax",
      path: "main.py",
      start: { line: 1, column: 1 },
      end: { line: 1, column: 2 },
      raw: ['File "/project/main.py", line 1', "SyntaxError: invalid syntax"],
    };
    installWorker((worker) => {
      worker.emit({ type: "runtime-ready", version: "1.28.0" });
      worker.emit({ type: "console", stream: "stderr", line: "compiler raw" });
      worker.emit({
        type: "error",
        stage: "compile",
        detail: "SyntaxError: invalid syntax",
        diagnostics: [diagnostic],
      });
    });

    await expect(checkCourseProjectSyntax(project)).resolves.toEqual({
      ok: false,
      detail: "SyntaxError: invalid syntax",
      compilerOutput: ["compiler raw", "SyntaxError: invalid syntax"],
      diagnostics: [diagnostic],
      output: ["compiler raw"],
    });
    expect(FakeWorker.instance?.posted).toEqual([{ mode: "check", project }]);
    expect(FakeWorker.instance?.terminate).toHaveBeenCalledOnce();
  });

  it("normalizes legacy worker errors that have no diagnostics field", async () => {
    installWorker((worker) => {
      worker.emit({
        type: "error",
        stage: "compile",
        detail: [
          "Traceback (most recent call last):",
          '  File "/project/main.py", line 1',
          "SyntaxError: invalid syntax",
        ].join("\n"),
      });
    });

    const result = await checkCourseProjectSyntax(project);
    expect(result).toMatchObject({ ok: false });
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "SyntaxError",
        path: "main.py",
        start: { line: 1, column: 1 },
      }),
    ]);
  });

  it("returns structured diagnostics through VirtualTargetClient.check", async () => {
    installWorker((worker) => {
      worker.emit({
        type: "error",
        stage: "compile",
        detail: [
          "Traceback (most recent call last):",
          '  File "/project/main.py", line 1',
          "SyntaxError: invalid syntax",
        ].join("\n"),
      });
    });

    const target = new VirtualTargetClient();
    const result = await target.check(project);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        source: "micropython",
        phase: "compile",
        path: "main.py",
        start: { line: 1, column: 1 },
      }),
    ]);
  });

  it("preserves compatibility with a successful legacy worker result", async () => {
    installWorker((worker) => {
      worker.emit({
        type: "check-complete",
        detail: "1 Python file compiled with MicroPython 1.28.0",
      });
    });

    await expect(checkCourseProjectSyntax(project)).resolves.toEqual({
      ok: true,
      detail: "1 Python file compiled with MicroPython 1.28.0",
      compilerOutput: ["1 Python file compiled with MicroPython 1.28.0"],
    });
  });

  it("terminates a stalled worker at the responsive syntax-check ceiling", async () => {
    vi.useFakeTimers();
    installWorker(() => {});

    const result = checkCourseProjectSyntax(project);
    const rejection = expect(result).rejects.toThrow(
      `timed out after ${BROWSER_SYNTAX_CHECK_TIMEOUT_MS / 1_000} seconds`,
    );
    await vi.advanceTimersByTimeAsync(BROWSER_SYNTAX_CHECK_TIMEOUT_MS);
    await rejection;
    expect(FakeWorker.instance?.terminate).toHaveBeenCalledOnce();
  });

  it("returns portable-project failures without starting a worker", async () => {
    installWorker(() => {
      throw new Error("worker should not start");
    });

    await expect(
      checkCourseProjectSyntax({ entrypoint: "notes.txt", files: {} }),
    ).resolves.toEqual({
      ok: false,
      detail: "This project has no files. Add a Python file, then try again.",
      compilerOutput: [
        "This project has no files. Add a Python file, then try again.",
      ],
      diagnostics: [
        {
          source: "project",
          phase: "compile",
          severity: "error",
          code: "invalid_project",
          message:
            "This project has no files. Add a Python file, then try again.",
          raw: [
            "This project has no files. Add a Python file, then try again.",
          ],
        },
      ],
    });
    expect(FakeWorker.instance).toBeNull();
  });
});
