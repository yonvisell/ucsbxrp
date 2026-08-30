import type { PythonDiagnostic } from "@ucsb-xrp/target";

export interface PythonDiagnosticPresentation {
  title: string;
  location: string;
  suggestion: string;
  sourceLine?: string;
  focusLine?: number;
}

function sentence(text: string): string {
  const trimmed = text.trim().replace(/[.\s]+$/, "");
  if (!trimmed) return "Python reported a problem";
  return `${trimmed[0]?.toUpperCase() ?? ""}${trimmed.slice(1)}.`;
}

function errorName(code: string | undefined): string {
  if (!code) return "Python problem";
  const words = code.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return `${words[0]?.toUpperCase() ?? ""}${words.slice(1)}`;
}

function location(diagnostic: PythonDiagnostic): string {
  if (!diagnostic.path) return "Project";
  if (!diagnostic.start) return diagnostic.path;
  const column = diagnostic.start.column;
  return `${diagnostic.path} · line ${diagnostic.start.line}${
    column > 1 ? `, column ${column}` : ""
  }`;
}

function sourceLines(
  diagnostic: PythonDiagnostic,
  files: Readonly<Record<string, string>>,
): string[] | undefined {
  if (!diagnostic.path) return undefined;
  const source = files[diagnostic.path];
  return source === undefined ? undefined : source.split("\n");
}

function likelyMissingComma(
  diagnostic: PythonDiagnostic,
  lines: readonly string[] | undefined,
): { line: number; text: string } | undefined {
  const reportedLine = diagnostic.start?.line;
  if (
    diagnostic.code !== "SyntaxError" ||
    !/invalid syntax/i.test(diagnostic.message) ||
    reportedLine === undefined ||
    reportedLine < 2 ||
    !lines
  ) {
    return undefined;
  }
  const current = lines[reportedLine - 1]?.trim() ?? "";
  const previous = lines[reportedLine - 2]?.trim() ?? "";
  if (
    !/^[A-Za-z_]\w*\s*=/.test(current) ||
    !/^[A-Za-z_]\w*\s*=/.test(previous) ||
    /[,([{\\]$/.test(previous) ||
    /[+\-*/%&|^<>:=]$/.test(previous)
  ) {
    return undefined;
  }
  return { line: reportedLine - 1, text: previous };
}

function likelyMissingColon(
  diagnostic: PythonDiagnostic,
  lines: readonly string[] | undefined,
): { line: number; text: string } | undefined {
  const reportedLine = diagnostic.start?.line;
  if (
    diagnostic.code !== "SyntaxError" ||
    reportedLine === undefined ||
    !lines
  ) {
    return undefined;
  }
  const current = lines[reportedLine - 1]?.trim() ?? "";
  if (
    /^(?:async\s+def|def|class|if|elif|else|for|while|try|except|finally|with|match|case)\b/.test(
      current,
    ) &&
    !current.endsWith(":")
  ) {
    return { line: reportedLine, text: current };
  }
  return undefined;
}

/**
 * Adds conservative, source-aware help without pretending to be a Python type
 * checker. Exact compiler text remains separate in Compiler output.
 */
export function presentPythonDiagnostic(
  diagnostic: PythonDiagnostic,
  files: Readonly<Record<string, string>>,
): PythonDiagnosticPresentation {
  const lines = sourceLines(diagnostic, files);
  const reportedLine = diagnostic.start?.line;
  const currentLine =
    reportedLine === undefined ? undefined : lines?.[reportedLine - 1]?.trim();
  const missingComma = likelyMissingComma(diagnostic, lines);
  if (missingComma) {
    return {
      title: "Syntax error near this line.",
      location: location(diagnostic),
      suggestion: `Likely fix: add a comma at the end of line ${missingComma.line}.`,
      sourceLine: missingComma.text,
      focusLine: missingComma.line,
    };
  }

  const missingColon = likelyMissingColon(diagnostic, lines);
  if (missingColon) {
    return {
      title: "This block header needs a colon.",
      location: location(diagnostic),
      suggestion: `Likely fix: add : at the end of line ${missingColon.line}.`,
      sourceLine: missingColon.text,
      focusLine: missingColon.line,
    };
  }

  if (
    diagnostic.code === "IndentationError" ||
    diagnostic.code === "TabError" ||
    /indent/i.test(diagnostic.message)
  ) {
    return {
      title: "Python cannot determine this line's block indentation.",
      location: location(diagnostic),
      suggestion:
        "Align this line with the surrounding block and use spaces consistently.",
      ...(currentLine ? { sourceLine: currentLine } : {}),
      ...(reportedLine ? { focusLine: reportedLine } : {}),
    };
  }

  if (
    diagnostic.code === "SyntaxError" &&
    /invalid syntax/i.test(diagnostic.message)
  ) {
    return {
      title: "Syntax error.",
      location: location(diagnostic),
      suggestion:
        "Check this line and the line immediately above for a missing comma, colon, bracket, or quote.",
      ...(currentLine ? { sourceLine: currentLine } : {}),
      ...(reportedLine ? { focusLine: reportedLine } : {}),
    };
  }

  const suggestionByCode: Readonly<Record<string, string>> = {
    AttributeError:
      "Check the object before the dot and use completion or hover to inspect known course members.",
    ImportError:
      "Check the module and imported name against the Project files and API reference.",
    ModuleNotFoundError:
      "Check the module spelling and confirm that its Python file is part of this Project.",
    NameError:
      "Check the name's spelling, then define or import it before this line runs.",
    TypeError:
      "Check the function arguments and the values supplied at this call.",
    ZeroDivisionError:
      "Guard the denominator so it cannot be zero before performing the division.",
  };

  return {
    title:
      diagnostic.message.trim() && diagnostic.message !== diagnostic.code
        ? sentence(diagnostic.message)
        : `${errorName(diagnostic.code)}.`,
    location: location(diagnostic),
    suggestion:
      suggestionByCode[diagnostic.code ?? ""] ??
      "Open the highlighted source and compare it with the exact MicroPython output.",
    ...(currentLine ? { sourceLine: currentLine } : {}),
    ...(reportedLine ? { focusLine: reportedLine } : {}),
  };
}
