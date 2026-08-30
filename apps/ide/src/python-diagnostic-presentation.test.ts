import { describe, expect, it } from "vitest";

import { presentPythonDiagnostic } from "./python-diagnostic-presentation";

describe("presentPythonDiagnostic", () => {
  it("points a generic next-line syntax error to the likely missing comma", () => {
    const presentation = presentPythonDiagnostic(
      {
        source: "micropython",
        phase: "compile",
        severity: "error",
        code: "SyntaxError",
        message: "invalid syntax",
        path: "main.py",
        start: { line: 14, column: 1 },
        end: { line: 14, column: 2 },
        raw: [],
      },
      {
        "main.py": [
          ...Array.from({ length: 12 }, () => ""),
          "    minimum=60.0",
          "    maximum=130.0,",
        ].join("\n"),
      },
    );

    expect(presentation).toEqual({
      title: "Syntax error near this line.",
      location: "main.py · line 14",
      suggestion: "Likely fix: add a comma at the end of line 13.",
      sourceLine: "minimum=60.0",
      focusLine: 13,
    });
  });

  it("suggests the missing colon on a block header", () => {
    const presentation = presentPythonDiagnostic(
      {
        source: "micropython",
        phase: "compile",
        severity: "error",
        code: "SyntaxError",
        message: "invalid syntax",
        path: "main.py",
        start: { line: 2, column: 1 },
        end: { line: 2, column: 2 },
        raw: [],
      },
      { "main.py": "print('ready')\nif ready\n" },
    );

    expect(presentation.suggestion).toBe(
      "Likely fix: add : at the end of line 2.",
    );
    expect(presentation.focusLine).toBe(2);
  });

  it("uses explicit line language and one non-redundant generic explanation", () => {
    const presentation = presentPythonDiagnostic(
      {
        source: "micropython",
        phase: "compile",
        severity: "error",
        code: "SyntaxError",
        message: "invalid syntax",
        path: "main.py",
        start: { line: 5, column: 1 },
        end: { line: 5, column: 2 },
        raw: [],
      },
      { "main.py": "\n\n\n\nresult = (1 +\n" },
    );

    expect(presentation.location).toBe("main.py · line 5");
    expect(presentation.title).toBe("Syntax error.");
    expect(`${presentation.title} ${presentation.suggestion}`).not.toMatch(
      /invalid syntax|SyntaxError/,
    );
  });
});
