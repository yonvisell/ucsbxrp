export type OscArgument =
  | { type: "i"; value: number }
  | { type: "f"; value: number }
  | { type: "s"; value: string };

export interface OscMessage {
  address: string;
  arguments: OscArgument[];
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function paddedLength(lengthIncludingNull: number): number {
  return Math.ceil(lengthIncludingNull / 4) * 4;
}

function encodedStringLength(value: string): number {
  return paddedLength(textEncoder.encode(value).byteLength + 1);
}

function writeOscString(
  view: Uint8Array,
  offset: number,
  value: string,
): number {
  const encoded = textEncoder.encode(value);
  view.set(encoded, offset);
  return offset + paddedLength(encoded.byteLength + 1);
}

function readOscString(
  view: Uint8Array,
  offset: number,
): { value: string; nextOffset: number } {
  let end = offset;
  while (end < view.byteLength && view[end] !== 0) {
    end += 1;
  }
  if (end === view.byteLength) {
    throw new Error("OSC string is missing its null terminator");
  }
  const value = textDecoder.decode(view.subarray(offset, end));
  return {
    value,
    nextOffset: offset + paddedLength(end - offset + 1),
  };
}

export function encodeOscMessage(message: OscMessage): ArrayBuffer {
  if (!message.address.startsWith("/")) {
    throw new Error("OSC addresses must begin with '/'");
  }

  const typeTags = `,${message.arguments.map((argument) => argument.type).join("")}`;
  const argumentLength = message.arguments.reduce((length, argument) => {
    return (
      length + (argument.type === "s" ? encodedStringLength(argument.value) : 4)
    );
  }, 0);
  const buffer = new ArrayBuffer(
    encodedStringLength(message.address) +
      encodedStringLength(typeTags) +
      argumentLength,
  );
  const bytes = new Uint8Array(buffer);
  const data = new DataView(buffer);
  let offset = writeOscString(bytes, 0, message.address);
  offset = writeOscString(bytes, offset, typeTags);

  for (const argument of message.arguments) {
    if (argument.type === "i") {
      if (!Number.isInteger(argument.value)) {
        throw new Error("OSC int32 values must be integers");
      }
      data.setInt32(offset, argument.value, false);
      offset += 4;
    } else if (argument.type === "f") {
      data.setFloat32(offset, argument.value, false);
      offset += 4;
    } else {
      offset = writeOscString(bytes, offset, argument.value);
    }
  }
  return buffer;
}

export function decodeOscMessage(buffer: ArrayBuffer): OscMessage {
  const bytes = new Uint8Array(buffer);
  const data = new DataView(buffer);
  const addressResult = readOscString(bytes, 0);
  if (!addressResult.value.startsWith("/")) {
    throw new Error("OSC address is invalid");
  }

  const tagsResult = readOscString(bytes, addressResult.nextOffset);
  if (!tagsResult.value.startsWith(",")) {
    throw new Error("OSC type tag string is invalid");
  }

  let offset = tagsResult.nextOffset;
  const arguments_: OscArgument[] = [];
  for (const type of tagsResult.value.slice(1)) {
    if (type === "i") {
      if (offset + 4 > buffer.byteLength) {
        throw new Error("OSC int32 argument is truncated");
      }
      arguments_.push({ type, value: data.getInt32(offset, false) });
      offset += 4;
    } else if (type === "f") {
      if (offset + 4 > buffer.byteLength) {
        throw new Error("OSC float32 argument is truncated");
      }
      arguments_.push({ type, value: data.getFloat32(offset, false) });
      offset += 4;
    } else if (type === "s") {
      const result = readOscString(bytes, offset);
      arguments_.push({ type, value: result.value });
      offset = result.nextOffset;
    } else {
      throw new Error(`Unsupported OSC type tag '${type}'`);
    }
  }

  return { address: addressResult.value, arguments: arguments_ };
}
