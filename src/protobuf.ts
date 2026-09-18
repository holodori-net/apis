export type ProtoValue = bigint | Buffer;

export class ProtobufError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProtobufError";
  }
}

export function encodeVarint(value: bigint | number): Buffer {
  const current = typeof value === "number" ? numberToBigInt(value) : value;
  if (current < 0n)
    throw new ProtobufError("protobuf varint cannot be negative");
  const bytes: number[] = [];
  let remaining = current;
  do {
    const byte = Number(remaining & 0x7fn);
    remaining >>= 7n;
    bytes.push(remaining === 0n ? byte : byte | 0x80);
  } while (remaining !== 0n);
  return Buffer.from(bytes);
}

export function encodeVarintField(
  field: number,
  value: bigint | number,
): Buffer {
  return Buffer.concat([encodeTag(field, 0), encodeVarint(value)]);
}

export function encodeStringField(field: number, value: string): Buffer {
  return encodeBytesField(field, Buffer.from(value, "utf8"));
}

export function encodeBytesField(field: number, value: Buffer): Buffer {
  return Buffer.concat([
    encodeTag(field, 2),
    encodeVarint(value.length),
    value,
  ]);
}

export function encodeMessage(...fields: readonly Buffer[]): Buffer {
  return Buffer.concat(fields);
}

function encodeTag(field: number, wireType: number): Buffer {
  if (!Number.isInteger(field) || field <= 0) {
    throw new ProtobufError(`invalid protobuf field number: ${field}`);
  }
  return encodeVarint(BigInt(field * 8 + wireType));
}

function numberToBigInt(value: number): bigint {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new ProtobufError(`invalid protobuf varint number: ${value}`);
  }
  return BigInt(value);
}

export function decodeProtoFields(data: Buffer): Map<number, ProtoValue[]> {
  const result = new Map<number, ProtoValue[]>();
  let offset = 0;
  while (offset < data.length) {
    const tag = readVarint(data, offset);
    offset = tag.offset;
    const field = Number(tag.value >> 3n);
    const wireType = Number(tag.value & 7n);
    if (!Number.isSafeInteger(field) || field <= 0) {
      throw new ProtobufError("protobuf contains invalid field number");
    }

    let value: ProtoValue;
    if (wireType === 0) {
      const decoded = readVarint(data, offset);
      offset = decoded.offset;
      value = decoded.value;
    } else if (wireType === 1) {
      ensureRemaining(data, offset, 8);
      value = data.subarray(offset, offset + 8);
      offset += 8;
    } else if (wireType === 2) {
      const length = readVarint(data, offset);
      offset = length.offset;
      if (length.value > BigInt(data.length - offset)) {
        throw new ProtobufError("protobuf length exceeds response");
      }
      const end = offset + Number(length.value);
      value = data.subarray(offset, end);
      offset = end;
    } else if (wireType === 5) {
      ensureRemaining(data, offset, 4);
      value = data.subarray(offset, offset + 4);
      offset += 4;
    } else {
      throw new ProtobufError(`unsupported protobuf wire type: ${wireType}`);
    }

    const values = result.get(field) ?? [];
    values.push(value);
    result.set(field, values);
  }
  return result;
}

function readVarint(
  data: Buffer,
  start: number,
): { value: bigint; offset: number } {
  let value = 0n;
  let shift = 0n;
  let offset = start;
  while (true) {
    if (offset >= data.length || shift > 63n) {
      throw new ProtobufError("malformed protobuf varint");
    }
    const byte = data[offset++];
    if (byte === undefined)
      throw new ProtobufError("malformed protobuf varint");
    value |= BigInt(byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) return { value, offset };
    shift += 7n;
  }
}

function ensureRemaining(data: Buffer, offset: number, size: number): void {
  if (offset + size > data.length) {
    throw new ProtobufError("protobuf fixed-width value exceeds response");
  }
}

export function firstBytes(
  fields: Map<number, ProtoValue[]>,
  field: number,
): Buffer | undefined {
  const value = fields.get(field)?.[0];
  return Buffer.isBuffer(value) ? value : undefined;
}

export function requireBytes(
  fields: Map<number, ProtoValue[]>,
  field: number,
  name: string,
): Buffer {
  const value = firstBytes(fields, field);
  if (!value)
    throw new ProtobufError(`missing protobuf ${name} field ${field}`);
  return value;
}

export function firstString(
  fields: Map<number, ProtoValue[]>,
  field: number,
): string | undefined {
  const value = firstBytes(fields, field);
  return value?.toString("utf8");
}

export function requireString(
  fields: Map<number, ProtoValue[]>,
  field: number,
  name: string,
): string {
  const value = firstString(fields, field);
  if (value === undefined || value.length === 0) {
    throw new ProtobufError(`missing protobuf ${name} field ${field}`);
  }
  return value;
}

export function firstUint(
  fields: Map<number, ProtoValue[]>,
  field: number,
): bigint | undefined {
  const value = fields.get(field)?.[0];
  return typeof value === "bigint" ? value : undefined;
}

export function firstBool(
  fields: Map<number, ProtoValue[]>,
  field: number,
): boolean {
  return (firstUint(fields, field) ?? 0n) !== 0n;
}
