import { firstString } from "../protocol/protobuf.js";
import { decodeProtoFields, encodeEmpty, isBuffer } from "./common.js";

export interface MultiGameListPingServerResponse {
  readonly servers: readonly MultiGamePingServer[];
}

export interface MultiGamePingServer {
  readonly region: string;
  readonly endpoint: string;
}

/** Encodes the empty MultiGame/ListPingServer request. */
export function encodeMultiGameListPingServerRequest(): Buffer {
  return encodeEmpty();
}

/** Decodes the advertised multiplayer ping servers. */
export function decodeMultiGameListPingServerResponse(
  data: Buffer,
): MultiGameListPingServerResponse {
  const fields = decodeProtoFields(data);
  return {
    servers: (fields.get(1) ?? []).filter(isBuffer).map(decodePingServer),
  };
}

function decodePingServer(data: Buffer): MultiGamePingServer {
  const fields = decodeProtoFields(data);
  return {
    region: firstString(fields, 1) ?? "",
    endpoint: firstString(fields, 2) ?? "",
  };
}
