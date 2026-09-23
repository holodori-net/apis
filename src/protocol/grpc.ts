import { gunzipSync } from "node:zlib";

import { ProtoEncError } from "./errors.js";

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
