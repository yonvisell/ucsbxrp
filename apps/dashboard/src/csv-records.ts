export type CsvRow = { cells: string[]; ending: string };

/** Retain raw field bytes, including quoted labels containing commas/newlines. */
export function csvRows(text: string): CsvRow[] {
  const rows: CsvRow[] = [];
  let cells: string[] = [];
  let start = 0;
  let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') index++;
      else quoted = !quoted;
    } else if (!quoted && (char === "," || char === "\n" || char === "\r")) {
      cells.push(text.slice(start, index));
      if (char !== ",") {
        const ending =
          char === "\r" && text[index + 1] === "\n" ? "\r\n" : char;
        rows.push({ cells, ending });
        cells = [];
        if (ending.length === 2) index++;
      }
      start = index + 1;
    }
  }
  if (quoted)
    throw new Error(
      "The saved telemetry CSV is incomplete. Export your notes separately.",
    );
  if (start < text.length || cells.length) {
    cells.push(text.slice(start));
    rows.push({ cells, ending: "" });
  }
  return rows;
}

export function decodeCsvCell(raw: string): string {
  return raw.startsWith('"') ? raw.slice(1, -1).replaceAll('""', '"') : raw;
}

export function encodeCsvCell(text: string): string {
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
