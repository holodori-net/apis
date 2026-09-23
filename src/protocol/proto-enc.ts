import { createCipheriv, createDecipheriv, createHash } from "node:crypto";
import { gunzipSync, gzipSync } from "node:zlib";

import { ProtoEncError } from "./errors.js";
import { extractGrpcPayload, grpcFrame } from "./grpc.js";

const DOTNET_EPOCH_TICKS = 621355968000000000n;
const COMPRESS_THRESHOLD = 2048;

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

function currentDotnetTicks(): bigint {
  return BigInt(Date.now()) * 10_000n + DOTNET_EPOCH_TICKS;
}

function md5(value: Buffer): Buffer {
  return createHash("md5").update(value).digest();
}
