import type {
  DescMessage,
  MessageInitShape,
  MessageShape,
} from "@bufbuild/protobuf";

import assert from "node:assert/strict";
import { test } from "vitest";

import { decodeProtoFields, encodeStringField } from "../src/low-level.js";
import { decodeProtobuf, encodeProtobuf } from "../src/protos/codec.js";
import { AuthLoginResponseSchema } from "../src/protos/gen/rpc/api/auth.gen_pb.js";
import { MasterGetResponseSchema } from "../src/protos/gen/rpc/api/master.gen_pb.js";
import { NoticeUpdateCategoryReadTimeResponseSchema } from "../src/protos/gen/rpc/api/notice.gen_pb.js";

void test("generated responses retain every descriptor field", () => {
  const login = roundTrip(AuthLoginResponseSchema, {
    gameAuthToken: "token-1",
    isPlayIntegrityCheckRequired: true,
    playIntegrityNonce: "nonce-1",
  });
  assert.equal(login.gameAuthToken, "token-1");
  assert.equal(login.isPlayIntegrityCheckRequired, true);
  assert.equal(login.playIntegrityNonce, "nonce-1");

  const master = roundTrip(MasterGetResponseSchema, {
    version: "master-1",
    masterTagPacks: [
      {
        type: "music",
        fileName: "music.pack",
        fileSize: 123,
        cryptoKey: "key",
        downloadUrl: "https://cdn.example/music.pack",
      },
    ],
  });
  assert.equal(master.masterTagPacks[0]?.fileName, "music.pack");

  const update = roundTrip(NoticeUpdateCategoryReadTimeResponseSchema, {
    commonResponse: { updatedMissions: [] },
  });
  assert.ok(update.commonResponse);
});

void test("generated responses retain unknown fields", () => {
  const bytes = Buffer.concat([
    encodeProtobuf(AuthLoginResponseSchema, { gameAuthToken: "token-1" }),
    encodeStringField(99, "future-value"),
  ]);
  const response = decodeProtobuf(AuthLoginResponseSchema, bytes);

  assert.equal(response.$unknown?.[0]?.no, 99);
  const reencoded = encodeProtobuf(AuthLoginResponseSchema, response);
  assert.equal(
    decodeProtoFields(reencoded).get(99)?.[0]?.toString(),
    "future-value",
  );
});

function roundTrip<Schema extends DescMessage>(
  schema: Schema,
  value: MessageInitShape<Schema>,
): MessageShape<Schema> {
  return decodeProtobuf(schema, encodeProtobuf(schema, value));
}
