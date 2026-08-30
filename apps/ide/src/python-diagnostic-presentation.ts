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

interface StructuralLineState {
  stack: string[];
  callStack: boolean[];
  inTripleString: boolean;
  valid: boolean;
}

/**
 * Return the open delimiters at the start of each source line. This deliberately
 * understands only ordinary single-line Python strings: if the source is more
 * complicated, the diagnostic presenter declines to guess.
 */
function structuralLineStates(lines: readonly string[]): StructuralLineState[] {
  const states: StructuralLineState[] = [];
  const stack: string[] = [];
  const callStack: boolean[] = [];
  let tripleQuote: "'''" | '\"\"\"' | undefined;
  let valid = true;
  const closingFor: Readonly<Record<string, string>> = {
    "(": ")",
    "[": "]",
    "{": "}",
  };

  for (const line of lines) {
    states.push({
      stack: [...stack],
      callStack: [...callStack],
      inTripleString: tripleQuote !== undefined,
      valid,
    });
    let quote: "'" | '"' | undefined;
    let escaped = false;
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index]!;
      if (tripleQuote) {
        if (line.startsWith(tripleQuote, index)) {
          index += 2;
          tripleQuote = undefined;
        }
        continue;
      }
      if (quote) {
        if (escaped) {
          escaped = false;
        } else if (character === "\\") {
          escaped = true;
        } else if (character === quote) {
          quote = undefined;
        }
        continue;
      }
      if (character === "#") break;
      if (line.startsWith("'''", index)) {
        tripleQuote = "'''";
        index += 2;
      } else if (line.startsWith('\"\"\"', index)) {
        tripleQuote = '\"\"\"';
        index += 2;
      } else if (character === "'" || character === '"') {
        quote = character;
      } else if (character in closingFor) {
        stack.push(character);
        const preceding = line.slice(0, index).trimEnd().at(-1) ?? "";
        callStack.push(character === "(" && /[A-Za-z0-9_\])]/.test(preceding));
      } else if (character === ")" || character === "]" || character === "}") {
        const opening = stack.pop();
        callStack.pop();
        if (!opening || closingFor[opening] !== character) valid = false;
      }
    }
    // Multiline and unterminated strings need the compiler's own explanation;
    // do not infer punctuation from a partial lexical model.
    if (quote) valid = false;
  }
  return states;
}

function structuralStateAfter(line: string): StructuralLineState {
  return structuralLineStates([line, ""])[1]!;
}

function codeWithoutComment(line: string): string {
  let quote: "'" | '"' | undefined;
  let escaped = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]!;
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = undefined;
    } else if (character === "'" || character === '"') {
      quote = character;
    } else if (character === "#") {
      return line.slice(0, index).trimEnd();
    }
  }
  return line.trimEnd();
}

function completeKeywordArgument(
  line: string,
  commaRequired: boolean,
): boolean {
  const code = codeWithoutComment(line).trim();
  if (!/^[A-Za-z_]\w*\s*=\s*\S/.test(code)) return false;
  if (commaRequired && !code.endsWith(",")) return false;
  const value = code.replace(/^[A-Za-z_]\w*\s*=\s*/, "").replace(/,$/, "");
  if (!value || /[+\-*/%&|^<>:=([{\\]$/.test(value)) return false;
  const after = structuralStateAfter(code);
  return after.valid && after.stack.length === 0;
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
  const states = structuralLineStates(lines);
  const previousState = states[reportedLine - 2];
  const currentState = states[reportedLine - 1];
  const previousIndent = lines[reportedLine - 2]?.match(/^\s*/)?.[0].length;
  const currentIndent = lines[reportedLine - 1]?.match(/^\s*/)?.[0].length;
  if (
    !/^[A-Za-z_]\w*\s*=/.test(current) ||
    !/^[A-Za-z_]\w*\s*=/.test(previous) ||
    !previousState?.valid ||
    !currentState?.valid ||
    previousState.stack.at(-1) !== "(" ||
    currentState.stack.at(-1) !== "(" ||
    previousState.inTripleString ||
    currentState.inTripleString ||
    previousState.callStack.at(-1) !== true ||
    currentState.callStack.at(-1) !== true ||
    previousState.stack.length !== currentState.stack.length ||
    previousIndent !== currentIndent ||
    !completeKeywordArgument(previous, false) ||
    !completeKeywordArgument(current, true) ||
    /[,([{\\]$/.test(previous) ||
    /[+\-*/%&|^<>:=]$/.test(previous)
  ) {
    return undefined;
  }
  return { line: reportedLine - 1, text: previous };
}

function unambiguousBlockHeader(code: string): boolean {
  if (/^(?:else|try|finally)$/.test(code)) return true;
  const atom = String.raw`(?:[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*|-?\d+(?:\.\d+)?|True|False|None|'[^']*'|"[^"]*")`;
  const expression = String.raw`(?:not\s+)?${atom}(?:\s*(?:==|!=|<=|>=|<|>)\s*${atom})?`;
  if (
    new RegExp(`^(?:if|elif|while|match|case)\\s+${expression}$`).test(code)
  ) {
    return true;
  }
  if (
    /^(?:async\s+)?def\s+[A-Za-z_]\w*\s*\(\s*\)(?:\s*->\s*[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)?$/.test(
      code,
    ) ||
    /^class\s+[A-Za-z_]\w*(?:\s*\(\s*\))?$/.test(code) ||
    /^(?:async\s+)?for\s+[A-Za-z_]\w*\s+in\s+[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*$/.test(
      code,
    ) ||
    /^(?:async\s+)?with\s+[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*(?:\s+as\s+[A-Za-z_]\w*)?$/.test(
      code,
    ) ||
    /^except(?:\s+[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*(?:\s+as\s+[A-Za-z_]\w*)?)?$/.test(
      code,
    )
  ) {
    return true;
  }
  return false;
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
  const code = codeWithoutComment(current).trim();
  const structure = structuralStateAfter(code);
  if (
    structure.valid &&
    !structure.inTripleString &&
    structure.stack.length === 0 &&
    unambiguousBlockHeader(code) &&
    !code.endsWith(":") &&
    !/[+\-*/%&|^<>=([{\\]$/.test(code)
  ) {
    return { line: reportedLine, text: code };
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
        "MicroPython stopped at this line, but the cause may be in the preceding statement. Inspect the highlighted source and the exact Compiler output.",
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
