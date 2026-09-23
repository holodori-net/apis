import { createCipheriv, createDecipheriv, createHash } from "node:crypto";
import { gunzipSync, gzipSync } from "node:zlib";

import { ProtobufError } from "./protobuf.js";

const DOTNET_EPOCH_TICKS = 621355968000000000n;
const COMPRESS_THRESHOLD = 2048;

export class ProtoEncError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ProtoEncError";
  }
}

/** Describes a non-zero gRPC status returned by the game API. */
export class GrpcStatusError extends ProtoEncError {
  readonly status: number;
  readonly rpcPath: string;
  readonly grpcMessage: string | undefined;

  constructor(rpcPath: string, status: number, grpcMessage?: string) {
    super(
      `${rpcPath} grpc-status ${status}${grpcMessage ? `: ${grpcMessage}` : ""}`,
    );
    this.name = "GrpcStatusError";
    this.rpcPath = rpcPath;
    this.status = status;
    this.grpcMessage = grpcMessage;
  }
}

export function grpcFrame(payload: Buffer, compressed = 0): Buffer {
  if (compressed !== 0 && compressed !== 1) {
    throw new ProtoEncError(`invalid gRPC compression flag: ${compressed}`);
  }
  const header = Buffer.alloc(5);
  header[0] = compressed;
  header.writeUInt32BE(payload.length, 1);
  return Buffer.concat([header, payload]);
}

export function encryptProto(
  proto: Buffer,
  secret: string,
  ticks = currentDotnetTicks(),
): Buffer {
  if (proto.length === 0) return grpcFrame(Buffer.alloc(0));
  const secretBytes = Buffer.from(secret, "utf8");
  const keyMaterial = Buffer.alloc(8);
  keyMaterial.writeBigUInt64LE(ticks);
  const compressed = proto.length > COMPRESS_THRESHOLD;
  const plaintext = compressed ? gzipSync(proto) : proto;
  const cipher = createCipheriv(
    "aes-128-cbc",
    md5(secretBytes),
    md5(Buffer.concat([secretBytes, keyMaterial])),
  );
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const header = Buffer.alloc(4);
  header.writeUInt16LE(keyMaterial.length + 2, 0);
  header[2] = compressed ? 1 : 0;
  header[3] = keyMaterial.length;
  return grpcFrame(Buffer.concat([header, keyMaterial, ciphertext]));
}

export function decryptProto(frame: Buffer, secret: string): Buffer {
  const payload = extractGrpcPayload(frame);
  if (payload.length === 0) return payload;
  if (payload.length < 4) {
    throw new ProtoEncError("proto-enc payload is shorter than its header");
  }
  const headerDataSize = payload.readUInt16LE(0);
  const compressed = payload[2] === 1;
  const keyLength = payload[3];
  if (keyLength === undefined) {
    throw new ProtoEncError("proto-enc payload has no key length");
  }
  const headerSize = headerDataSize + 2;
  if (
    headerSize !== keyLength + 4 ||
    payload.length <= headerSize ||
    (payload.length - headerSize) % 16 !== 0
  ) {
    throw new ProtoEncError("invalid proto-enc header or ciphertext boundary");
  }
  const secretBytes = Buffer.from(secret, "utf8");
  const keyMaterial = payload.subarray(4, 4 + keyLength);
  const decipher = createDecipheriv(
    "aes-128-cbc",
    md5(secretBytes),
    md5(Buffer.concat([secretBytes, keyMaterial])),
  );
  try {
    const plaintext = Buffer.concat([
      decipher.update(payload.subarray(headerSize)),
      decipher.final(),
    ]);
    return compressed ? gunzipSync(plaintext) : plaintext;
  } catch (error) {
    throw new ProtoEncError(`proto-enc decryption failed: ${String(error)}`);
  }
}

export function extractGrpcPayload(frame: Buffer): Buffer {
  if (frame.length < 5) {
    throw new ProtoEncError(
      "gRPC response is shorter than its five-byte frame",
    );
  }
  const compressed = frame[0];
  const length = frame.readUInt32BE(1);
  if (frame.length !== length + 5) {
    throw new ProtoEncError(
      `gRPC frame length mismatch: header=${length}, actual=${frame.length - 5}`,
    );
  }
  const payload = frame.subarray(5);
  if (compressed === 0) return payload;
  if (compressed === 1) {
    try {
      return gunzipSync(payload);
    } catch (error) {
      throw new ProtoEncError(
        `gRPC gzip decompression failed: ${String(error)}`,
      );
    }
  }
  throw new ProtoEncError(
    `unsupported outer gRPC compression flag: ${compressed}`,
  );
}

function currentDotnetTicks(): bigint {
  return BigInt(Date.now()) * 10_000n + DOTNET_EPOCH_TICKS;
}

function md5(value: Buffer): Buffer {
  return createHash("md5").update(value).digest();
}

export function assertGrpcSuccess(
  headers: Record<string, string>,
  trailers: Record<string, string>,
  method: string,
): void {
  const grpcStatus = trailers["grpc-status"] ?? headers["grpc-status"];
  if (grpcStatus === undefined) {
    throw new ProtoEncError(`${method} response has no grpc-status`);
  }
  if (grpcStatus !== "0") {
    const status = Number(grpcStatus);
    if (!Number.isInteger(status))
      throw new ProtoEncError(
        `${method} has invalid grpc-status ${grpcStatus}`,
      );
    const encodedMessage = trailers["grpc-message"] ?? headers["grpc-message"];
    throw new GrpcStatusError(
      method,
      status,
      encodedMessage === undefined
        ? undefined
        : decodeGrpcMessage(encodedMessage),
    );
  }
}

function decodeGrpcMessage(message: string): string {
  try {
    return decodeURIComponent(message);
  } catch {
    return message;
  }
}

export function wrapProtocolError(error: unknown): Error {
  if (error instanceof ProtobufError || error instanceof ProtoEncError)
    return error;
  return error instanceof Error ? error : new ProtoEncError(String(error));
}
