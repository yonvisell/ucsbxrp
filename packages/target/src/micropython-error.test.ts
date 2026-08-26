import { describe, expect, it } from "vitest";

import { studentFacingMicroPythonError } from "./micropython-error";

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
});
