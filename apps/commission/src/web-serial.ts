export interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
}

export interface SerialPortLike {
  readonly readable: ReadableStream<Uint8Array> | null;
  readonly writable: WritableStream<Uint8Array> | null;
  open(options: { baudRate: number; bufferSize?: number }): Promise<void>;
  close(): Promise<void>;
  getInfo(): SerialPortInfo;
  setSignals?(signals: { dataTerminalReady?: boolean }): Promise<void>;
}

interface SerialApiLike {
  requestPort(options: {
    filters: Array<{ usbVendorId: number; usbProductId: number }>;
  }): Promise<SerialPortLike>;
  getPorts(): Promise<SerialPortLike[]>;
}

export interface ExpectedUsbController {
  usbVendorId: number;
  usbProductId: number;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function serialApi(): SerialApiLike | null {
  return (
    (
      navigator as Navigator & {
        serial?: SerialApiLike;
      }
    ).serial ?? null
  );
}

export function supportsWebSerial(): boolean {
  return window.isSecureContext && serialApi() !== null;
}

export class SerialPortOpenError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "SerialPortOpenError";
  }
}

export async function requestXrpPort(
  controller: ExpectedUsbController,
): Promise<SerialPortLike> {
  const serial = serialApi();
  if (!serial) {
    throw new Error(
      "USB setup requires desktop Chrome or Edge on HTTPS or localhost.",
    );
  }
  return serial.requestPort({
    filters: [
      {
        usbVendorId: controller.usbVendorId,
        usbProductId: controller.usbProductId,
      },
    ],
  });
}

export function matchesXrpController(
  port: SerialPortLike,
  controller: ExpectedUsbController,
): boolean {
  const info = port.getInfo();
  return (
    info.usbVendorId === controller.usbVendorId &&
    info.usbProductId === controller.usbProductId
  );
}

export async function findGrantedXrpPort(
  controller: ExpectedUsbController,
): Promise<SerialPortLike | null> {
  const serial = serialApi();
  if (!serial) {
    return null;
  }
  const matches = (await serial.getPorts()).filter((port) =>
    matchesXrpController(port, controller),
  );
  if (matches.length > 1) {
    throw new Error("More than one XRP is connected. Leave one connected.");
  }
  return matches[0] ?? null;
}

function bytesEndWith(value: readonly number[], suffix: Uint8Array): boolean {
  if (value.length < suffix.length) {
    return false;
  }
  const offset = value.length - suffix.length;
  for (let index = 0; index < suffix.length; index += 1) {
    if (value[offset + index] !== suffix[index]) {
      return false;
    }
  }
  return true;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class SerialByteConnection {
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private readonly buffered: number[] = [];
  private readonly dataWaiters = new Set<() => void>();
  private terminalError: Error | null = null;
  private closing = false;
  private pumpPromise: Promise<void> | null = null;

  constructor(readonly port: SerialPortLike) {}

  async open(baudRate = 115_200): Promise<void> {
    await this.port.open({ baudRate, bufferSize: 4_096 });
    if (!this.port.readable || !this.port.writable) {
      throw new Error("The selected USB device has no serial data streams.");
    }
    this.reader = this.port.readable.getReader();
    this.writer = this.port.writable.getWriter();
    this.pumpPromise = this.pump();
  }

  private async pump(): Promise<void> {
    try {
      while (this.reader) {
        const { value, done } = await this.reader.read();
        if (done) {
          if (!this.closing) {
            this.terminalError = new Error("The XRP disconnected from USB.");
          }
          break;
        }
        if (value) {
          this.buffered.push(...value);
          this.notifyData();
        }
      }
    } catch (error) {
      if (!this.closing) {
        this.terminalError = new Error(
          `USB serial read failed: ${errorMessage(error)}`,
        );
      }
    } finally {
      this.notifyData();
    }
  }

  private notifyData(): void {
    for (const resolve of this.dataWaiters) {
      resolve();
    }
    this.dataWaiters.clear();
  }

  private waitForData(timeoutMs: number): Promise<void> {
    if (this.buffered.length > 0) {
      return Promise.resolve();
    }
    if (this.terminalError) {
      return Promise.reject(this.terminalError);
    }
    return new Promise((resolve, reject) => {
      const onData = () => {
        clearTimeout(timeout);
        if (this.terminalError && this.buffered.length === 0) {
          reject(this.terminalError);
        } else {
          resolve();
        }
      };
      const timeout = window.setTimeout(() => {
        this.dataWaiters.delete(onData);
        reject(new Error("Timed out waiting for the XRP over USB."));
      }, timeoutMs);
      this.dataWaiters.add(onData);
    });
  }

  async write(value: Uint8Array | string): Promise<void> {
    if (!this.writer) {
      throw new Error("The XRP serial connection is not open.");
    }
    await this.writer.write(
      typeof value === "string" ? textEncoder.encode(value) : value,
    );
  }

  clearInput(): void {
    this.buffered.length = 0;
  }

  async readExact(count: number, timeoutMs = 10_000): Promise<Uint8Array> {
    const result: number[] = [];
    const deadline = Date.now() + timeoutMs;
    while (result.length < count) {
      while (this.buffered.length > 0 && result.length < count) {
        result.push(this.buffered.shift()!);
      }
      if (result.length === count) {
        break;
      }
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        throw new Error("Timed out waiting for the XRP over USB.");
      }
      await this.waitForData(remaining);
    }
    return Uint8Array.from(result);
  }

  async readUntil(
    ending: Uint8Array | string,
    timeoutMs = 10_000,
  ): Promise<Uint8Array> {
    const suffix =
      typeof ending === "string" ? textEncoder.encode(ending) : ending;
    const result: number[] = [];
    const deadline = Date.now() + timeoutMs;
    while (!bytesEndWith(result, suffix)) {
      while (this.buffered.length > 0 && !bytesEndWith(result, suffix)) {
        result.push(this.buffered.shift()!);
      }
      if (bytesEndWith(result, suffix)) {
        break;
      }
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        throw new Error("Timed out waiting for the XRP over USB.");
      }
      await this.waitForData(remaining);
    }
    return Uint8Array.from(result);
  }

  async close(): Promise<void> {
    this.closing = true;
    try {
      await this.reader?.cancel();
    } catch {
      // A reset may have already removed the USB endpoint.
    }
    try {
      await this.pumpPromise;
    } catch {
      // The read loop records its useful error before completing.
    }
    this.reader?.releaseLock();
    this.reader = null;
    this.writer?.releaseLock();
    this.writer = null;
    try {
      await this.port.close();
    } catch {
      // A hard reset can close the platform port before the browser does.
    }
  }
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds));
}

export interface ReplResult {
  stdout: string;
  stderr: string;
}

export interface MicroPythonSession {
  execute(code: string, timeoutMs?: number): Promise<ReplResult>;
  executeWithoutFollow(code: string): Promise<void>;
  close(): Promise<void>;
}

export class RawReplSession implements MicroPythonSession {
  private rawPasteSupported = true;
  private operation: Promise<void> = Promise.resolve();

  constructor(private readonly connection: SerialByteConnection) {}

  async enter(): Promise<void> {
    await this.connection.write(Uint8Array.of(13, 3, 3, 3));
    await sleep(150);
    this.connection.clearInput();
    await this.connection.write(Uint8Array.of(13, 1));
    await this.connection.readUntil("raw REPL; CTRL-B to exit\r\n", 10_000);
  }

  async execute(code: string, timeoutMs = 10_000): Promise<ReplResult> {
    return this.enqueue(async () => {
      await this.sendCommand(textEncoder.encode(code));
      const output = await this.connection.readUntil(
        Uint8Array.of(4),
        timeoutMs,
      );
      const error = await this.connection.readUntil(
        Uint8Array.of(4),
        timeoutMs,
      );
      return {
        stdout: textDecoder.decode(output.slice(0, -1)),
        stderr: textDecoder.decode(error.slice(0, -1)),
      };
    });
  }

  async executeWithoutFollow(code: string): Promise<void> {
    await this.enqueue(() => this.sendCommand(textEncoder.encode(code)));
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.operation.then(operation, operation);
    this.operation = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  private async sendCommand(command: Uint8Array): Promise<void> {
    await this.connection.readUntil(Uint8Array.of(62));
    if (this.rawPasteSupported) {
      await this.connection.write(Uint8Array.of(5, 65, 1));
      const response = await this.connection.readExact(2);
      if (response[0] === 82 && response[1] === 1) {
        await this.writeRawPaste(command);
        return;
      }
      if (response[0] === 82 && response[1] === 0) {
        this.rawPasteSupported = false;
      } else {
        const fallbackPrefix = textDecoder.decode(response);
        if (fallbackPrefix !== "ra") {
          throw new Error("The XRP returned an invalid raw-paste response.");
        }
        await this.connection.readUntil("w REPL; CTRL-B to exit\r\n>");
        this.rawPasteSupported = false;
      }
    }
    await this.writeStandardRaw(command);
  }

  private async writeRawPaste(command: Uint8Array): Promise<void> {
    const windowBytes = await this.connection.readExact(2);
    const windowSize = windowBytes[0]! | (windowBytes[1]! << 8);
    if (windowSize < 1) {
      throw new Error("The XRP returned an invalid raw-paste window.");
    }
    let available = windowSize;
    let offset = 0;
    while (offset < command.length) {
      if (available === 0) {
        const token = (await this.connection.readExact(1))[0];
        if (token === 1) {
          available += windowSize;
          continue;
        }
        if (token === 4) {
          await this.connection.write(Uint8Array.of(4));
          throw new Error(
            "The XRP stopped receiving the installation command.",
          );
        }
        throw new Error("The XRP returned invalid raw-paste flow control.");
      }
      const count = Math.min(available, command.length - offset, 512);
      await this.connection.write(command.slice(offset, offset + count));
      offset += count;
      available -= count;
    }
    await this.connection.write(Uint8Array.of(4));
    await this.connection.readUntil(Uint8Array.of(4));
  }

  private async writeStandardRaw(command: Uint8Array): Promise<void> {
    for (let offset = 0; offset < command.length; offset += 256) {
      await this.connection.write(command.slice(offset, offset + 256));
      await sleep(10);
    }
    await this.connection.write(Uint8Array.of(4));
    const accepted = await this.connection.readExact(2);
    if (accepted[0] !== 79 || accepted[1] !== 75) {
      throw new Error("The XRP could not compile an installation command.");
    }
  }

  async close(): Promise<void> {
    await this.operation;
    await this.connection.close();
  }
}

export async function openRawRepl(
  port: SerialPortLike,
): Promise<RawReplSession> {
  const connection = new SerialByteConnection(port);
  try {
    await connection.open();
  } catch (error) {
    throw new SerialPortOpenError(
      "Chrome could not open the XRP USB connection. Close any other setup page using the XRP, then try again.",
      { cause: error },
    );
  }
  const session = new RawReplSession(connection);
  try {
    await session.enter();
    return session;
  } catch (error) {
    await session.close();
    throw error;
  }
}

export async function touchUf2Bootloader(port: SerialPortLike): Promise<void> {
  await port.open({ baudRate: 1_200 });
  try {
    if (!port.setSignals) {
      throw new Error("This browser cannot place the XRP in firmware mode.");
    }
    await port.setSignals({ dataTerminalReady: true });
    await sleep(50);
    await port.setSignals({ dataTerminalReady: false });
  } finally {
    await port.close();
  }
}
