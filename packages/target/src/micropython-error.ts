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
