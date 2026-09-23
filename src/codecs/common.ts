import {
  decodeProtoFields,
  encodeMessage,
  encodeStringField,
  type ProtoValue,
  requireString,
} from "../protocol/protobuf.js";

export { decodeProtoFields, encodeMessage, encodeStringField, requireString };
export type { ProtoValue };

export function encodeEmpty(): Buffer {
  return Buffer.alloc(0);
}

export function encodeCredentialRequest(credential: string): Buffer {
  return encodeMessage(
    encodeStringField(1, requireNonEmpty(credential, "credential")),
  );
}

export function requireNonEmpty(value: string, name: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new RangeError(`${name} must not be empty`);
  }
  return value;
}

export function toSafeNumber(value: bigint, name: string): number {
  if (
    value > BigInt(Number.MAX_SAFE_INTEGER) ||
    value < BigInt(Number.MIN_SAFE_INTEGER)
  ) {
    throw new RangeError(`${name} exceeds JavaScript safe integer range`);
  }
  return Number(value);
}

export function isBuffer(value: ProtoValue): value is Buffer {
  return Buffer.isBuffer(value);
}

export function decodeRepeatedMessages<T>(
  fields: Map<number, ProtoValue[]>,
  field: number,
  decode: (data: Buffer) => T,
): T[] {
  return (fields.get(field) ?? []).filter(isBuffer).map(decode);
}
