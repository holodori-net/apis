import {
  decodeProtoFields,
  encodeCredentialRequest,
  encodeEmpty,
  requireString,
} from "./common.js";

export function encodeAuthCreateRequest(): Buffer {
  return encodeEmpty();
}

export function encodeAuthLoginRequest(credential: string): Buffer {
  return encodeCredentialRequest(credential);
}

export function decodeCredentialResponse(data: Buffer): string {
  return requireString(decodeProtoFields(data), 1, "credential");
}

export function decodeGameAuthTokenResponse(data: Buffer): string {
  return requireString(decodeProtoFields(data), 1, "game auth token");
}
