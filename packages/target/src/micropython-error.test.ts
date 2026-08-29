import { describe, expect, it } from "vitest";

import {
  MAX_PYTHON_DIAGNOSTIC_COLUMN,
  MAX_PYTHON_DIAGNOSTIC_LINE,
  MAX_PYTHON_DIAGNOSTIC_RAW_LINES,
  parseMicroPythonDiagnostics,
  studentFacingMicroPythonError,
} from "./micropython-error";

describe("student-facing MicroPython errors", () => {
  it("removes only the internal WebAssembly launch frame", () => {
    const detail = [
      "Traceback (most recent call last):",
      '  File "<stdin>", line 3, in <module>',
      '  File "/project/main.py", line 7',
      "SyntaxError: invalid syntax",
    ].join("\n");

    expect(studentFacingMicroPythonError(detail)).toBe(
      [
        "Traceback (most recent call last):",
        '  File "/project/main.py", line 7',
        "SyntaxError: invalid syntax",
      ].join("\n"),
    );
  });

  it("does not alter ordinary student exceptions", () => {
    const detail = 'File "/project/robot.py", line 12\nValueError: gain';
    expect(studentFacingMicroPythonError(detail)).toBe(detail);
  });

  it("normalizes a browser traceback to a portable one-based range", () => {
    const detail = [
      "Traceback (most recent call last):",
      '  File "<stdin>", line 3, in <module>',
      '  File "/project/student/controller.py", line 7',
      "SyntaxError: invalid syntax",
    ].join("\n");

    expect(
      parseMicroPythonDiagnostics(detail, {
        projectPaths: ["main.py", "student/controller.py"],
      }),
    ).toEqual([
      {
        source: "micropython",
        phase: "compile",
        severity: "error",
        code: "SyntaxError",
        message: "invalid syntax",
        path: "student/controller.py",
        start: { line: 7, column: 1 },
        end: { line: 7, column: 2 },
        raw: [
          "Traceback (most recent call last):",
          '  File "/project/student/controller.py", line 7',
          "SyntaxError: invalid syntax",
        ],
      },
    ]);
  });

  it("parses the physical compact syntax form and repairs zero columns", () => {
    expect(
      parseMicroPythonDiagnostics(
        "student/controller.py:17:0: unexpected indent",
        {
          code: "syntax_error",
          projectPaths: ["student/controller.py"],
        },
      ),
    ).toEqual([
      expect.objectContaining({
        code: "syntax_error",
        message: "unexpected indent",
        path: "student/controller.py",
        start: { line: 17, column: 1 },
        end: { line: 17, column: 2 },
      }),
    ]);
  });

  it("does not turn a target-loading failure into a Python diagnostic", () => {
    expect(
      parseMicroPythonDiagnostics(
        "Reference artifact could not be loaded: planner.mpy",
      ),
    ).toEqual([]);
  });

  it("does not expose non-project traceback paths as editor paths", () => {
    const diagnostics = parseMicroPythonDiagnostics(
      [
        "Traceback (most recent call last):",
        '  File "/ucsb_xrp/robot.py", line 92, in update',
        '  File "/tmp/project/main.py", line 4, in update',
        "ValueError: gain",
      ].join("\n"),
      { phase: "runtime", projectPaths: ["main.py"] },
    );

    expect(diagnostics).toEqual([
      expect.objectContaining({
        phase: "runtime",
        code: "ValueError",
        message: "gain",
      }),
    ]);
    expect(diagnostics[0]).not.toHaveProperty("path");
    expect(diagnostics[0]).not.toHaveProperty("start");
  });

  it("bounds adversarial coordinates and raw traceback volume", () => {
    const middle = Array.from({ length: 200 }, (_, index) => `line ${index}`);
    const diagnostics = parseMicroPythonDiagnostics(
      [
        "Traceback (most recent call last):",
        ...middle,
        `  File "/project/main.py", line 999999999999999999999`,
        "SyntaxError: invalid syntax",
      ].join("\n"),
      { projectPaths: ["main.py"] },
    );

    expect(diagnostics[0]?.start).toEqual({
      line: MAX_PYTHON_DIAGNOSTIC_LINE,
      column: 1,
    });
    expect(diagnostics[0]?.end).toEqual({
      line: MAX_PYTHON_DIAGNOSTIC_LINE,
      column: 2,
    });
    expect(diagnostics[0]?.raw).toHaveLength(MAX_PYTHON_DIAGNOSTIC_RAW_LINES);
    expect(diagnostics[0]?.raw).toContainEqual(
      expect.stringMatching(/traceback lines omitted/),
    );

    const compact = parseMicroPythonDiagnostics(
      `main.py:2:999999999999999999999: invalid syntax`,
      { code: "syntax_error", projectPaths: ["main.py"] },
    );
    expect(compact[0]?.start?.column).toBe(MAX_PYTHON_DIAGNOSTIC_COLUMN);
    expect(compact[0]?.end?.column).toBe(MAX_PYTHON_DIAGNOSTIC_COLUMN);
  });
});
