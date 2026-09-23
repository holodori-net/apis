import { firstUint } from "../protobuf.js";
import { decodeProtoFields, encodeEmpty, encodeStringField } from "./common.js";

export enum HealthCheckServingStatus {
  Unknown = 0,
  Serving = 1,
  NotServing = 2,
  ServiceUnknown = 3,
}

export interface HealthCheckResponse {
  readonly status: HealthCheckServingStatus;
}

export function encodeHealthCheckRequest(service = ""): Buffer {
  return service.length === 0 ? encodeEmpty() : encodeStringField(1, service);
}

export function decodeHealthCheckResponse(data: Buffer): HealthCheckResponse {
  const status = firstUint(decodeProtoFields(data), 1) ?? 0n;
  if (status > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(
      "health serving status exceeds JavaScript safe integer range",
    );
  }
  return { status: Number(status) };
}
