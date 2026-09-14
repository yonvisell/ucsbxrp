export interface RuntimeOutputLine {
  stream: "stdout" | "stderr";
  line: string;
}

/** Limits transport work while Python is synchronous and cannot yield to timers. */
export class RuntimeOutput {
  private startedMs: number;
  private lines: RuntimeOutputLine[] = [];
  private accepted = 0;
  private omitted = 0;
  private reservedErrors = 0;
  constructor(
    private readonly send: (
      lines: RuntimeOutputLine[],
      omitted: number,
    ) => void,
    private readonly now: () => number = () => performance.now(),
  ) {
    this.startedMs = now();
  }

  write(stream: RuntimeOutputLine["stream"], text: string): void {
    const now = this.now();
    if (now - this.startedMs >= 100) {
      this.flush();
      this.startedMs = now;
      this.accepted = 0;
      this.reservedErrors = 0;
    }
    if (this.accepted >= 20) {
      if (stream === "stderr" && this.reservedErrors < 4)
        this.reservedErrors += 1;
      else {
        this.omitted += 1;
        return;
      }
    }
    this.accepted += 1;
    const line =
      text.length > 2048 ? `${text.slice(0, 2048)} … [line truncated]` : text;
    this.lines.push({ stream, line });
    // Send the first milestone immediately; bursts are grouped or omitted.
    if (this.accepted === 1 || stream === "stderr") this.flush();
  }
  flush(): void {
    if (this.lines.length || this.omitted) this.send(this.lines, this.omitted);
    this.lines = [];
    this.omitted = 0;
  }
}
