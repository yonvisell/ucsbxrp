import { parseMicroPythonDiagnostics } from "./micropython-error";
import { portableProjectError } from "./project-validation";
import type { RuntimeWorkerMessage } from "./worker-protocol";
import type { CheckResult, CourseProject } from "./types";

/**
 * Exact-runtime syntax checks normally complete well below one second. This is
 * a failure ceiling, not a delay: the result is returned on the worker event.
 * A stalled worker must fail fast enough that Compile still feels interactive.
 */
export const BROWSER_SYNTAX_CHECK_TIMEOUT_MS = 2_500;

const MAX_CHECK_OUTPUT_LINES = 2_000;

export interface CourseProjectSyntaxCheckHandle {
  readonly result: Promise<CheckResult>;
  cancel(reason?: string): void;
}

function createSyntaxWorker(): Worker {
  return new Worker(new URL("./micropython.worker.ts", import.meta.url), {
    type: "module",
    name: "ucsb-xrp-micropython-syntax-check",
  });
}

function fallbackDiagnostics(
  message: Extract<RuntimeWorkerMessage, { type: "error" }>,
  output: readonly string[],
  project: CourseProject,
) {
  if (message.diagnostics !== undefined) return message.diagnostics;

  const options = {
    phase:
      message.stage === "run" ? ("runtime" as const) : ("compile" as const),
    projectPaths: Object.keys(project.files),
  };
  const detailDiagnostics = parseMicroPythonDiagnostics(
    message.detail,
    options,
  );
  const outputDiagnostics = parseMicroPythonDiagnostics(
    output.join("\n"),
    options,
  );
  if (
    outputDiagnostics[0]?.path &&
    !detailDiagnostics.some((diagnostic) => diagnostic.path)
  ) {
    return outputDiagnostics;
  }
  return detailDiagnostics.length > 0 ? detailDiagnostics : outputDiagnostics;
}

/**
 * Start a disposable, event-driven browser MicroPython syntax check. The
 * handle is used by VirtualTargetClient to cancel outstanding work on
 * disconnect; ordinary callers should use checkCourseProjectSyntax.
 */
export function startCourseProjectSyntaxCheck(
  project: CourseProject,
): CourseProjectSyntaxCheckHandle {
  const portabilityError = portableProjectError(project);
  if (portabilityError) {
    return {
      result: Promise.resolve({
        ok: false,
        detail: portabilityError.message,
        compilerOutput: [portabilityError.message],
        diagnostics: [
          {
            source: "project",
            phase: "compile",
            severity: "error",
            code: portabilityError.code,
            message: portabilityError.message,
            raw: [portabilityError.message],
          },
        ],
      }),
      cancel() {},
    };
  }

  let worker: Worker | null = null;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let settled = false;
  let rejectResult: ((reason: Error) => void) | null = null;

  const output: string[] = [];
  const finish = () => {
    if (timeout !== null) clearTimeout(timeout);
    timeout = null;
    worker?.terminate();
    worker = null;
  };

  const result = new Promise<CheckResult>((resolve, reject) => {
    rejectResult = reject;
    const resolveOnce = (value: CheckResult) => {
      if (settled) return;
      settled = true;
      finish();
      resolve(value);
    };
    const rejectOnce = (error: Error) => {
      if (settled) return;
      settled = true;
      finish();
      reject(error);
    };

    try {
      worker = createSyntaxWorker();
    } catch (error) {
      rejectOnce(
        new Error(
          error instanceof Error
            ? error.message
            : "MicroPython project checker could not start",
        ),
      );
      return;
    }

    timeout = setTimeout(() => {
      rejectOnce(
        new Error(
          `MicroPython project check timed out after ${BROWSER_SYNTAX_CHECK_TIMEOUT_MS / 1_000} seconds`,
        ),
      );
    }, BROWSER_SYNTAX_CHECK_TIMEOUT_MS);

    worker.onmessage = (event: MessageEvent<RuntimeWorkerMessage>) => {
      const message = event.data;
      if (message.type === "console") {
        if (output.length < MAX_CHECK_OUTPUT_LINES) output.push(message.line);
        return;
      }
      if (message.type === "check-complete") {
        const diagnostics = message.diagnostics ?? [];
        resolveOnce({
          ok: true,
          detail: message.detail,
          compilerOutput: [...output, message.detail],
          ...(diagnostics.length > 0 ? { diagnostics } : {}),
          ...(output.length > 0 ? { output } : {}),
        });
        return;
      }
      if (message.type === "error") {
        const diagnostics = fallbackDiagnostics(message, output, project);
        resolveOnce({
          ok: false,
          detail: message.detail,
          compilerOutput: [...output, message.detail],
          ...(diagnostics.length > 0 ? { diagnostics } : {}),
          ...(output.length > 0 ? { output } : {}),
        });
      }
    };
    worker.onerror = (event) => {
      rejectOnce(
        new Error(event.message || "MicroPython project checker failed"),
      );
    };
    worker.onmessageerror = () => {
      rejectOnce(
        new Error("MicroPython project checker returned invalid data"),
      );
    };
    try {
      worker.postMessage({ mode: "check", project });
    } catch (error) {
      rejectOnce(
        new Error(
          error instanceof Error
            ? error.message
            : "MicroPython project checker could not receive the project",
        ),
      );
    }
  });

  return {
    result,
    cancel(reason = "MicroPython project check was cancelled") {
      if (settled) return;
      settled = true;
      finish();
      rejectResult?.(new Error(reason));
    },
  };
}

/**
 * Check a project with the browser's exact MicroPython runtime without
 * connecting to either target. The IDE can call this before a physical-device
 * check so syntax feedback does not depend on robot availability.
 */
export function checkCourseProjectSyntax(
  project: CourseProject,
): Promise<CheckResult> {
  return startCourseProjectSyntaxCheck(project).result;
}
