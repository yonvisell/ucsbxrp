import { decodeOscMessage, encodeOscMessage } from "@ucsb-xrp/osc";

import type {
  CheckResult,
  CourseProject,
  TargetClient,
  TargetEvent,
} from "./types";

export interface PhysicalTransport {
  connect(onFrame: (frame: ArrayBuffer) => void): Promise<void>;
  disconnect(): void;
  send(frame: ArrayBuffer): void;
}

/**
 * Provisional OSC client boundary. The transport remains injected until the
 * attached-XRP HTTPS-origin test selects WebSocket or request streaming.
 */
export class PhysicalTargetClient implements TargetClient {
  readonly kind = "physical" as const;
  private readonly listeners = new Set<(event: TargetEvent) => void>();

  constructor(private readonly transport: PhysicalTransport) {}

  async connect(): Promise<void> {
    this.emit({
      type: "status",
      state: "connecting",
      detail: "Connecting to physical XRP",
    });
    await this.transport.connect((frame) => this.receive(frame));
    this.transport.send(
      encodeOscMessage({ address: "/system/connect", arguments: [] }),
    );
    this.emit({
      type: "status",
      state: "ready",
      detail: "Physical transport connected",
    });
  }

  disconnect(): void {
    this.transport.disconnect();
    this.emit({
      type: "status",
      state: "disconnected",
      detail: "Physical target disconnected",
    });
  }

  async check(project: CourseProject): Promise<CheckResult> {
    this.transport.send(
      encodeOscMessage({
        address: "/system/check",
        arguments: [
          { type: "s", value: project.entrypoint },
          { type: "s", value: project.files[project.entrypoint] ?? "" },
        ],
      }),
    );
    return {
      ok: true,
      detail:
        "Check request sent; hardware reply is pending Stage 1 validation",
    };
  }

  async run(project: CourseProject): Promise<void> {
    this.transport.send(
      encodeOscMessage({
        address: "/system/run",
        arguments: [
          { type: "s", value: project.entrypoint },
          { type: "s", value: project.files[project.entrypoint] ?? "" },
        ],
      }),
    );
  }

  async stop(): Promise<void> {
    this.transport.send(
      encodeOscMessage({ address: "/system/stop", arguments: [] }),
    );
  }

  async reset(): Promise<void> {
    this.transport.send(
      encodeOscMessage({ address: "/system/reset", arguments: [] }),
    );
  }

  subscribe(listener: (event: TargetEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private receive(frame: ArrayBuffer): void {
    const message = decodeOscMessage(frame);
    if (message.address === "/log/stdout") {
      const line = message.arguments[0];
      if (line?.type === "s") {
        this.emit({ type: "console", stream: "stdout", line: line.value });
      }
    }
  }

  private emit(event: TargetEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
