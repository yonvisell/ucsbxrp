import type { PythonDiagnostic } from "./types";
import { MAX_PORTABLE_PROJECT_PATH_CHARACTERS } from "./project-validation";

export const MAX_PYTHON_DIAGNOSTIC_LINE = 1_000_000;
export const MAX_PYTHON_DIAGNOSTIC_COLUMN = 1_000_000;
export const MAX_PYTHON_DIAGNOSTIC_MESSAGE_CHARACTERS = 2_048;
export const MAX_PYTHON_DIAGNOSTIC_RAW_LINES = 128;
export const MAX_PYTHON_DIAGNOSTIC_RAW_LINE_CHARACTERS = 2_048;

const MAX_DIAGNOSTIC_CODE_CHARACTERS = 80;
const portableProjectPath = /^[A-Za-z0-9._/-]+$/;
const tracebackFrame =
  /^\s*File\s+["']([^"']+)["'],\s*line\s+(\d+)(?:,\s*in\s+.*)?\s*$/;
const exceptionSummary =
  /^([A-Za-z_][A-Za-z0-9_.]*(?:Error|Exception|Interrupt)):\s*(.*)$/;
const compactSourceLocation = /^(.+?\.py):(\d+)(?::(\d+|none|null))?:\s*(.*)$/i;
const ansiEscape = /\u001b\[[0-?]*[ -/]*[@-~]/g;

export interface ParseMicroPythonDiagnosticOptions {
  phase?: PythonDiagnostic["phase"];
  code?: string;
  /** Known portable paths make absolute or library traceback frames inert. */
  projectPaths?: Iterable<string>;
}

function boundedInteger(value: string | number, maximum: number): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.min(Math.trunc(parsed), maximum));
}

function boundedText(value: string, maximum: number): string {
  if (value.length <= maximum) return value;
  const suffix = "… [truncated]";
  return `${value.slice(0, Math.max(0, maximum - suffix.length))}${suffix}`;
}

function boundedRawLines(detail: string): string[] {
  const lines = detail
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
    .split("\n")
    .map((line) =>
      boundedText(line, MAX_PYTHON_DIAGNOSTIC_RAW_LINE_CHARACTERS),
    );
  while (lines[0] === "") lines.shift();
  while (lines.at(-1) === "") lines.pop();
  if (lines.length <= MAX_PYTHON_DIAGNOSTIC_RAW_LINES) return lines;

  const retainedBefore = Math.floor((MAX_PYTHON_DIAGNOSTIC_RAW_LINES - 1) / 2);
  const retainedAfter = MAX_PYTHON_DIAGNOSTIC_RAW_LINES - retainedBefore - 1;
  const omitted = lines.length - retainedBefore - retainedAfter;
  return [
    ...lines.slice(0, retainedBefore),
    `… [${omitted} traceback lines omitted]`,
    ...lines.slice(-retainedAfter),
  ];
}

function normalizedCandidatePath(rawPath: string): string | undefined {
  let candidate = rawPath.trim().replaceAll("\\", "/");
  if (candidate.startsWith("<") && candidate.endsWith(">")) return undefined;

  const projectPrefix = "/project/";
  if (candidate.startsWith(projectPrefix)) {
    candidate = candidate.slice(projectPrefix.length);
  } else if (candidate.startsWith("project/")) {
    candidate = candidate.slice("project/".length);
  } else if (candidate.startsWith("./")) {
    candidate = candidate.slice(2);
  } else if (candidate.startsWith("/") || /^[A-Za-z]:\//.test(candidate)) {
    return undefined;
  }

  candidate = candidate.replace(/^\/+|\/+$/g, "");
  if (
    candidate.length === 0 ||
    candidate.length > MAX_PORTABLE_PROJECT_PATH_CHARACTERS ||
    !portableProjectPath.test(candidate) ||
    candidate
      .split("/")
      .some((part) => part === "" || part === "." || part === "..")
  ) {
    return undefined;
  }
  return candidate;
}

function normalizedKnownPaths(
  projectPaths: Iterable<string> | undefined,
): Set<string> | undefined {
  if (!projectPaths) return undefined;
  const normalized = new Set<string>();
  for (const path of projectPaths) {
    const candidate = normalizedCandidatePath(path);
    if (candidate) normalized.add(candidate);
  }
  return normalized;
}

function projectPath(
  rawPath: string,
  knownPaths: Set<string> | undefined,
): string | undefined {
  const normalized = normalizedCandidatePath(rawPath);
  if (!normalized) return undefined;
  if (knownPaths && !knownPaths.has(normalized)) return undefined;
  return normalized;
}

function nonemptyParsingLines(raw: readonly string[]): string[] {
  return raw
    .map((line) => line.replace(ansiEscape, ""))
    .filter((line) => line.trim().length > 0);
}

/**
 * Remove the WebAssembly launch frame while preserving the student's Python
 * filename, line number, exception type, and message.
 */
export function studentFacingMicroPythonError(detail: string): string {
  return detail
    .split("\n")
    .filter(
      (line) => !/^\s*File "<stdin>", line \d+(?:, in .*)?\s*$/.test(line),
    )
    .join("\n")
    .trim();
}

/**
 * Parse the traceback and compact `path:line:column: message` forms emitted by
 * the browser and physical MicroPython runtimes. Unrecognized infrastructure
 * errors deliberately return no diagnostic; callers should still retain and
 * display their original `detail` string.
 */
export function parseMicroPythonDiagnostics(
  detail: string,
  options: ParseMicroPythonDiagnosticOptions = {},
): PythonDiagnostic[] {
  const studentDetail = studentFacingMicroPythonError(String(detail));
  const raw = boundedRawLines(studentDetail);
  const lines = nonemptyParsingLines(raw);
  if (lines.length === 0) return [];

  const knownPaths = normalizedKnownPaths(options.projectPaths);
  let path: string | undefined;
  let line: number | undefined;
  let column: number | undefined;

  for (const candidateLine of lines) {
    const match = tracebackFrame.exec(candidateLine);
    if (!match) continue;
    const candidatePath = projectPath(match[1] ?? "", knownPaths);
    if (!candidatePath) continue;
    path = candidatePath;
    line = boundedInteger(match[2] ?? 1, MAX_PYTHON_DIAGNOSTIC_LINE);
    column = 1;
  }

  let code = options.code?.trim() || undefined;
  let message = lines.at(-1)?.trim() ?? studentDetail;
  const summary = exceptionSummary.exec(message);
  if (summary) {
    code = summary[1];
    message = summary[2]?.trim() || summary[1] || message;
  }

  const compact = compactSourceLocation.exec(message);
  if (compact) {
    const candidatePath = projectPath(compact[1] ?? "", knownPaths);
    if (candidatePath) path = candidatePath;
    line = boundedInteger(compact[2] ?? 1, MAX_PYTHON_DIAGNOSTIC_LINE);
    column = boundedInteger(
      compact[3]?.toLowerCase() === "none" ||
        compact[3]?.toLowerCase() === "null"
        ? 1
        : (compact[3] ?? 1),
      MAX_PYTHON_DIAGNOSTIC_COLUMN,
    );
    message = compact[4]?.trim() || message;
  }

  const recognized =
    path !== undefined ||
    line !== undefined ||
    summary !== null ||
    code !== undefined;
  if (!recognized) return [];

  const start =
    line === undefined
      ? undefined
      : {
          line,
          column: column ?? 1,
        };
  const end = start
    ? {
        line: start.line,
        column: Math.min(MAX_PYTHON_DIAGNOSTIC_COLUMN, start.column + 1),
      }
    : undefined;

  return [
    {
      source: "micropython",
      phase: options.phase ?? "compile",
      severity: "error",
      ...(code
        ? {
            code: boundedText(code, MAX_DIAGNOSTIC_CODE_CHARACTERS),
          }
        : {}),
      message: boundedText(
        message || "MicroPython reported an error",
        MAX_PYTHON_DIAGNOSTIC_MESSAGE_CHARACTERS,
      ),
      ...(path ? { path } : {}),
      ...(start ? { start, end } : {}),
      raw,
    },
  ];
}
