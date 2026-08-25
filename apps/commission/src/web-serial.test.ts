import { afterEach, describe, expect, it } from "vitest";

import {
  findGrantedXrpPort,
  openRawRepl,
  RawReplSession,
  matchesXrpController,
  SerialPortOpenError,
  type SerialPortLike,
} from "./web-serial";

const encoder = new TextEncoder();
const originalSerial = Object.getOwnPropertyDescriptor(navigator, "serial");

afterEach(() => {
  if (originalSerial) {
    Object.defineProperty(navigator, "serial", originalSerial);
  } else {
    Reflect.deleteProperty(navigator, "serial");
  }
});

describe("Web Serial raw REPL", () => {
  it("filters the exact SparkFun controller identity", () => {
    const port = {
      getInfo: () => ({ usbVendorId: 0x1b4f, usbProductId: 0x0046 }),
    } as SerialPortLike;
    expect(
      matchesXrpController(port, {
        usbVendorId: 0x1b4f,
        usbProductId: 0x0046,
      }),
    ).toBe(true);
    expect(
      matchesXrpController(port, {
        usbVendorId: 0x1b4f,
        usbProductId: 0x0001,
      }),
    ).toBe(false);
  });

  it("finds one previously approved XRP without opening a picker", async () => {
    const matching = {
      getInfo: () => ({ usbVendorId: 0x1b4f, usbProductId: 0x0046 }),
    } as SerialPortLike;
    const unrelated = {
      getInfo: () => ({ usbVendorId: 1, usbProductId: 2 }),
    } as SerialPortLike;
    Object.defineProperty(navigator, "serial", {
      configurable: true,
      value: {
        getPorts: async () => [unrelated, matching],
      },
    });

    await expect(
      findGrantedXrpPort({
        usbVendorId: 0x1b4f,
        usbProductId: 0x0046,
      }),
    ).resolves.toBe(matching);
  });

  it("does not guess when two approved XRPs are connected", async () => {
    const port = () =>
      ({
        getInfo: () => ({ usbVendorId: 0x1b4f, usbProductId: 0x0046 }),
      }) as SerialPortLike;
    Object.defineProperty(navigator, "serial", {
      configurable: true,
      value: { getPorts: async () => [port(), port()] },
    });

    await expect(
      findGrantedXrpPort({
        usbVendorId: 0x1b4f,
        usbProductId: 0x0046,
      }),
    ).rejects.toThrow("More than one XRP is connected");
  });

  it("distinguishes a busy USB port from missing MicroPython firmware", async () => {
    const port = {
      readable: null,
      writable: null,
      open: async () => {
        throw new DOMException("Port is already open", "InvalidStateError");
      },
      close: async () => undefined,
      getInfo: () => ({ usbVendorId: 0x1b4f, usbProductId: 0x0046 }),
    } as SerialPortLike;

    await expect(openRawRepl(port)).rejects.toBeInstanceOf(SerialPortOpenError);
  });

  it("enters raw REPL and uses raw-paste flow control", async () => {
    const writes: Uint8Array[] = [];
    const until = [
      encoder.encode("raw REPL; CTRL-B to exit\r\n"),
      encoder.encode(">"),
      Uint8Array.of(4),
      encoder.encode("done\r\n\x04"),
      Uint8Array.of(4),
    ];
    const exact = [Uint8Array.of(82, 1), Uint8Array.of(128, 0)];
    let closed = false;
    const connection = {
      write: async (value: Uint8Array | string) => {
        writes.push(typeof value === "string" ? encoder.encode(value) : value);
      },
      clearInput: () => undefined,
      readUntil: async () => until.shift()!,
      readExact: async () => exact.shift()!,
      close: async () => {
        closed = true;
      },
    };
    const session = new RawReplSession(connection as never);
    await session.enter();
    await expect(session.execute("print('done')")).resolves.toEqual({
      stdout: "done\r\n",
      stderr: "",
    });
    await session.close();

    expect(writes.some((value) => value.join(",") === "5,65,1")).toBe(true);
    expect(
      writes.some((value) =>
        new TextDecoder().decode(value).includes("print('done')"),
      ),
    ).toBe(true);
    expect(closed).toBe(true);
  });

  it("falls back to standard raw REPL when raw paste is unavailable", async () => {
    const writes: Uint8Array[] = [];
    const until = [
      Uint8Array.of(62),
      encoder.encode("fallback\r\n\x04"),
      Uint8Array.of(4),
    ];
    const exact = [Uint8Array.of(82, 0), Uint8Array.of(79, 75)];
    const connection = {
      write: async (value: Uint8Array | string) => {
        writes.push(typeof value === "string" ? encoder.encode(value) : value);
      },
      readUntil: async () => until.shift()!,
      readExact: async () => exact.shift()!,
      close: async () => undefined,
    };
    const session = new RawReplSession(connection as never);
    await expect(session.execute("print('fallback')")).resolves.toEqual({
      stdout: "fallback\r\n",
      stderr: "",
    });

    expect(writes.some((value) => value.join(",") === "5,65,1")).toBe(true);
    expect(writes.some((value) => value.join(",") === "4")).toBe(true);
  });

  it("resets before closing a raw-REPL session", async () => {
    const writes: Uint8Array[] = [];
    let closed = false;
    let exactReads = 0;
    const connection = {
      write: async (value: Uint8Array | string) => {
        writes.push(typeof value === "string" ? encoder.encode(value) : value);
      },
      readUntil: async () => Uint8Array.of(62),
      readExact: async () =>
        ++exactReads === 1 ? Uint8Array.of(82, 0) : Uint8Array.of(79, 75),
      close: async () => {
        closed = true;
      },
    };
    const session = new RawReplSession(connection as never);

    await session.resetAndClose();
    await session.resetAndClose();

    expect(
      writes.some((value) =>
        new TextDecoder().decode(value).includes("machine.reset()"),
      ),
    ).toBe(true);
    expect(closed).toBe(true);
    expect(
      writes.filter((value) =>
        new TextDecoder().decode(value).includes("machine.reset()"),
      ),
    ).toHaveLength(1);
  });
});
