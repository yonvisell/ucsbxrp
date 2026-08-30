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
          ...Array.from({ length: 11 }, () => ""),
          "FORWARD_SPEED = live.number(",
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

  it("does not invent a missing comma between ordinary assignments", () => {
    const presentation = presentPythonDiagnostic(
      {
        source: "micropython",
        phase: "compile",
        severity: "error",
        code: "SyntaxError",
        message: "invalid syntax",
        path: "main.py",
        start: { line: 3, column: 1 },
        end: { line: 3, column: 2 },
        raw: [],
      },
      { "main.py": "speed = 120\nturn_rate = 0.8\nresult =\n" },
    );

    expect(presentation.title).toBe("Syntax error.");
    expect(presentation.suggestion).not.toContain("comma");
    expect(presentation.focusLine).toBe(3);
  });

  it("does not invent a comma when the following keyword value is incomplete", () => {
    const presentation = presentPythonDiagnostic(
      {
        source: "micropython",
        phase: "compile",
        severity: "error",
        code: "SyntaxError",
        message: "invalid syntax",
        path: "main.py",
        start: { line: 3, column: 5 },
        raw: [],
      },
      { "main.py": "live.number(\n    minimum=60.0\n    maximum=\n" },
    );

    expect(presentation.title).toBe("Syntax error.");
    expect(presentation.suggestion).not.toContain("comma");
    expect(presentation.focusLine).toBe(3);
  });

  it("does not call grouped assignments function arguments", () => {
    const presentation = presentPythonDiagnostic(
      {
        source: "micropython",
        phase: "compile",
        severity: "error",
        code: "SyntaxError",
        message: "invalid syntax",
        path: "main.py",
        start: { line: 3, column: 5 },
        raw: [],
      },
      {
        "main.py": "value = (\n    minimum=60\n    maximum=130,\n)",
      },
    );

    expect(presentation.title).toBe("Syntax error.");
    expect(presentation.suggestion).not.toContain("comma");
  });

  it("does not claim a colon fixes an incomplete condition", () => {
    const presentation = presentPythonDiagnostic(
      {
        source: "micropython",
        phase: "compile",
        severity: "error",
        code: "SyntaxError",
        message: "invalid syntax",
        path: "main.py",
        start: { line: 1, column: 8 },
        raw: [],
      },
      { "main.py": "if speed ==\n" },
    );

    expect(presentation.title).toBe("Syntax error.");
    expect(presentation.suggestion).not.toContain("colon");
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

  it.each([
    "else print('x')",
    "try work()",
    "if ready print('x')",
    "def f(x x)",
    "class C(A B)",
  ])("does not claim a colon alone fixes malformed header %s", (source) => {
    const presentation = presentPythonDiagnostic(
      {
        source: "micropython",
        phase: "compile",
        severity: "error",
        code: "SyntaxError",
        message: "invalid syntax",
        path: "main.py",
        start: { line: 1, column: 1 },
        raw: [],
      },
      { "main.py": `${source}\n` },
    );

    expect(presentation.title).toBe("Syntax error.");
    expect(presentation.suggestion).not.toContain("add :");
  });

  it("keeps conservative syntax help after a multiline docstring", () => {
    const presentation = presentPythonDiagnostic(
      {
        source: "micropython",
        phase: "compile",
        severity: "error",
        code: "SyntaxError",
        message: "invalid syntax",
        path: "main.py",
        start: { line: 3, column: 1 },
        raw: [],
      },
      { "main.py": '\"\"\"Module\nnotes\"\"\"\nif ready\n' },
    );

    expect(presentation.suggestion).toBe(
      "Likely fix: add : at the end of line 3.",
    );
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
