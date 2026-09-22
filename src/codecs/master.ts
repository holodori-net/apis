import { decodeProtoFields, encodeEmpty, requireString } from "./common.js";

export function encodeMasterGetRequest(): Buffer {
  return encodeEmpty();
}

export function decodeMasterVersionResponse(data: Buffer): string {
  return requireString(decodeProtoFields(data), 1, "master version");
}
