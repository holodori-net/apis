import assert from "node:assert/strict";
import { test } from "vitest";

import { HolodoriApi } from "../src/index.js";
import {
  decodeProtoFields,
  decryptProto,
  encryptProto,
} from "../src/low-level.js";
import { encodeProtobuf } from "../src/protos/codec.js";
import {
  AuthCreateResponseSchema,
  AuthLoginResponseSchema,
} from "../src/protos/gen/rpc/api/auth.gen_pb.js";
import { MasterGetResponseSchema } from "../src/protos/gen/rpc/api/master.gen_pb.js";
import { UserGetResponseSchema } from "../src/protos/gen/rpc/api/user.gen_pb.js";
import {
  type ApiTransport,
  type ApiTransportRequest,
  type ApiTransportResponse,
} from "../src/transports/index.js";

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

void test("returns the full User/Get message and offers a cards convenience method", async () => {
  const transport = new FakeTransport();
  transport.respond(
    "/rpc.api.Auth/Create",
    encodeProtobuf(AuthCreateResponseSchema, { credential: "credential-1" }),
  );
  transport.respond(
    "/rpc.api.Auth/Login",
    encodeProtobuf(AuthLoginResponseSchema, { gameAuthToken: "token-1" }),
  );
  transport.respond(
    "/rpc.api.Master/Get",
    encodeProtobuf(MasterGetResponseSchema, { version: "master-1" }),
  );
  transport.respond(
    "/rpc.api.User/Get",
    encodeProtobuf(UserGetResponseSchema, {
      userData: {
        user: { publicUserId: "public-user-1" },
        userCardList: [{ cardId: "card-1", exp: 2n }],
      },
    }),
    encodeProtobuf(UserGetResponseSchema, {
      userData: {
        user: { publicUserId: "public-user-1" },
        userCardList: [{ cardId: "card-1", exp: 2n }],
      },
    }),
  );

  const api = await HolodoriApi.create(
    { appVersion: "1.1.0", apiSecret: SECRET, autoAuthenticate: false },
    transport,
  );
  const cards = await api.user.listCards();
  const response = await api.user.getSnapshot();

  assert.equal(cards.length, 1);
  assert.equal(cards[0]?.cardId, "card-1");
  assert.equal(response.userData?.user?.publicUserId, "public-user-1");
  assert.equal(response.userData?.userCardList[0]?.exp, 2n);
  assert.deepEqual(
    transport.requests.map((request) => new URL(request.url).pathname),
    [
      "/rpc.api.Auth/Create",
      "/rpc.api.Auth/Login",
      "/rpc.api.Master/Get",
      "/rpc.api.User/Get",
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
