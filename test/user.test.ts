import assert from "node:assert/strict";
import { test } from "vitest";

import {
  decodeUserGetResponse,
  USER_DATA_CARDS_FIELD,
} from "../src/codecs/user.js";
import { HolodoriApi } from "../src/index.js";
import {
  decodeProtoFields,
  decryptProto,
  encodeBytesField,
  encodeMessage,
  encodeStringField,
  encodeVarintField,
  encryptProto,
} from "../src/low-level.js";
import {
  type ApiTransport,
  type ApiTransportRequest,
  type ApiTransportResponse,
} from "../src/transport.js";

const SECRET = "test-api-secret";

class FakeTransport implements ApiTransport {
  readonly requests: ApiTransportRequest[] = [];
  private readonly responses = new Map<string, Buffer[]>();

  respond(path: string, ...messages: Buffer[]): void {
    this.responses.set(
      path,
      messages.map((message) => encryptProto(message, SECRET)),
    );
  }

  request(request: ApiTransportRequest): Promise<ApiTransportResponse> {
    this.requests.push(request);
    const path = new URL(request.url).pathname;
    const queue = this.responses.get(path);
    if (!queue?.length) throw new Error(`no fake response for ${path}`);
    const responseBody = queue.shift();
    if (!responseBody) throw new Error(`empty fake response for ${path}`);
    return Promise.resolve({
      status: 200,
      headers: {},
      trailers: { "grpc-status": "0" },
      body: responseBody,
    });
  }
}

void test("decodes User/Get cards with the large UserData field number", () => {
  const card = encodeMessage(
    encodeStringField(2, "card-1"),
    encodeVarintField(3, 9_007_199_254_740_993n),
    encodeVarintField(4, 4),
    encodeVarintField(5, 5),
    encodeVarintField(6, 6),
    encodeVarintField(7, 1_700_000_000_000n),
  );
  const response = encodeMessage(
    encodeBytesField(
      1,
      encodeMessage(encodeBytesField(USER_DATA_CARDS_FIELD, card)),
    ),
  );

  assert.deepEqual(decodeUserGetResponse(response), {
    cards: [
      {
        cardId: "card-1",
        exp: 9_007_199_254_740_993n,
        levelLimitBreakCount: 4,
        potentialUpgradeCount: 5,
        potentialUpgradePointQuantity: 6,
        acquiredTime: 1_700_000_000_000n,
      },
    ],
  });
});

void test("lazily authenticates and lists cards without a request ID", async () => {
  const transport = new FakeTransport();
  transport.respond(
    "/rpc.api.Auth/Create",
    encodeMessage(encodeStringField(1, "credential-1")),
  );
  transport.respond(
    "/rpc.api.Auth/Login",
    encodeMessage(encodeStringField(1, "token-1")),
  );
  transport.respond(
    "/rpc.api.Master/Get",
    encodeMessage(encodeStringField(1, "master-1")),
  );
  const card = encodeMessage(encodeStringField(2, "card-1"));
  transport.respond(
    "/rpc.api.User/Get",
    encodeMessage(
      encodeBytesField(
        1,
        encodeMessage(encodeBytesField(USER_DATA_CARDS_FIELD, card)),
      ),
    ),
  );

  const api = await HolodoriApi.create(
    { appVersion: "1.1.0", apiSecret: SECRET, autoAuthenticate: false },
    transport,
  );
  const cards = await api.user.listCards();

  assert.equal(cards.length, 1);
  assert.equal(cards[0]?.cardId, "card-1");
  assert.deepEqual(
    transport.requests.map((request) => new URL(request.url).pathname),
    [
      "/rpc.api.Auth/Create",
      "/rpc.api.Auth/Login",
      "/rpc.api.Master/Get",
      "/rpc.api.User/Get",
    ],
  );
  const userRequest = transport.requests.at(-1);
  assert.equal(userRequest?.headers?.["x-app-auth-token"], "token-1");
  assert.equal(userRequest?.headers?.["x-app-master-version"], "master-1");
  assert.equal(userRequest?.headers?.["x-app-request-id"], undefined);
  assert.equal(
    decodeProtoFields(
      decryptProto(userRequest?.body ?? Buffer.alloc(0), SECRET),
    ).size,
    0,
  );
});
