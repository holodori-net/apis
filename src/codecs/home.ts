import { firstString, type ProtoValue } from "../protocol/protobuf.js";
import {
  decodeProtoFields,
  encodeEmpty,
  isBuffer,
  toSafeNumber,
} from "./common.js";

export interface HomeRealtimeNotificationConnectionInfo {
  readonly sseToken: string;
  readonly sseUrl: string;
}

export interface HomeLoginResponse {
  readonly ruleTypes: readonly number[];
  readonly fcmTopics: readonly string[];
  readonly realtimeNotificationConnectionInfo?: HomeRealtimeNotificationConnectionInfo;
}

export function encodeHomeLoginRequest(): Buffer {
  return encodeEmpty();
}

export function decodeHomeLoginResponse(data: Buffer): HomeLoginResponse {
  const fields = decodeProtoFields(data);
  const connection = fields.get(6)?.find(isBuffer);
  return {
    ruleTypes: repeatedInt32(fields, 3),
    fcmTopics: (fields.get(5) ?? [])
      .filter(isBuffer)
      .map((value) => value.toString("utf8")),
    ...(connection === undefined
      ? {}
      : {
          realtimeNotificationConnectionInfo:
            decodeRealtimeNotificationConnectionInfo(connection),
        }),
  };
}

function decodeRealtimeNotificationConnectionInfo(
  data: Buffer,
): HomeRealtimeNotificationConnectionInfo {
  const fields = decodeProtoFields(data);
  return {
    sseToken: firstString(fields, 1) ?? "",
    sseUrl: firstString(fields, 2) ?? "",
  };
}

function repeatedInt32(
  fields: Map<number, ProtoValue[]>,
  field: number,
): readonly number[] {
  return (fields.get(field) ?? []).flatMap((value) =>
    typeof value === "bigint"
      ? [toSafeNumber(value, `protobuf int32 field ${field}`)]
      : decodePackedInt32(value, field),
  );
}

function decodePackedInt32(data: Buffer, field: number): readonly number[] {
  const values: number[] = [];
  let offset = 0;
  while (offset < data.length) {
    let value = 0n;
    let shift = 0n;
    while (true) {
      const byte = data[offset++];
      if (byte === undefined || shift > 63n)
        throw new Error("malformed packed protobuf varint");
      value |= BigInt(byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) break;
      shift += 7n;
    }
    values.push(toSafeNumber(value, `protobuf int32 field ${field}`));
  }
  return values;
}
