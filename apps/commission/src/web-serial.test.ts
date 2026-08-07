import { describe, expect, it } from "vitest";

import {
  RawReplSession,
  matchesXrpController,
  type SerialPortLike,
} from "./web-serial";

const encoder = new TextEncoder();

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
});
