import assert from "node:assert/strict";
import { test } from "vitest";

import { decodeCredentialResponse } from "../src/codecs/auth.js";
import { ApiClient, HolodoriApiError } from "../src/core/client.js";
import { type ApiMethod } from "../src/core/method.js";
import { ApiSession } from "../src/core/session.js";
import {
  encodeMessage,
  encodeStringField,
  encryptProto,
} from "../src/index.js";
import {
  type ApiTransport,
  type ApiTransportRequest,
  type ApiTransportResponse,
} from "../src/transport.js";

const SECRET = "test-api-secret";

class FakeTransport implements ApiTransport {
  readonly requests: ApiTransportRequest[] = [];

  request(request: ApiTransportRequest): Promise<ApiTransportResponse> {
    this.requests.push(request);
    return Promise.resolve({
      status: 200,
      headers: {},
      trailers: { "grpc-status": "0" },
      body: encryptProto(
        encodeMessage(encodeStringField(1, "response")),
        SECRET,
      ),
    });
  }
}

const AUTH_ONLY: ApiMethod<void, string> = {
  path: "/rpc.api.Test/AuthOnly",
  requiresGameAuth: true,
  requiresMasterVersion: false,
  usesResponseCache: false,
  requiresRequestSignature: false,
  encode: () => Buffer.alloc(0),
  decode: decodeCredentialResponse,
};

const MASTER_ONLY: ApiMethod<void, string> = {
  path: "/rpc.api.Test/MasterOnly",
  requiresGameAuth: false,
  requiresMasterVersion: true,
  usesResponseCache: false,
  requiresRequestSignature: false,
  encode: () => Buffer.alloc(0),
  decode: decodeCredentialResponse,
};

const SIGNED: ApiMethod<void, string> = {
  path: "/rpc.api.Test/Signed",
  requiresGameAuth: false,
  requiresMasterVersion: false,
  usesResponseCache: false,
  requiresRequestSignature: true,
  encode: () => Buffer.alloc(0),
  decode: decodeCredentialResponse,
};

function createClient(
  session: ApiSession,
  transport: FakeTransport,
): ApiClient {
  return new ApiClient(
    {
      appVersion: "1.1.0",
      apiSecret: SECRET,
      baseUrl: "https://test.example",
      bundleId: "test.bundle",
      lang: "jpn",
      os: "Android",
      store: "GooglePlay",
      timeoutMs: 30_000,
    },
    session,
    transport,
  );
}

void test("keeps game auth and master header policies independent", async () => {
  const transport = new FakeTransport();
  const client = createClient(
    new ApiSession({ gameAuthToken: "token", masterVersion: undefined }),
    transport,
  );
  await client.call(AUTH_ONLY, undefined);
  assert.equal(transport.requests[0]?.headers?.["x-app-auth-token"], "token");
  assert.equal(
    transport.requests[0]?.headers?.["x-app-master-version"],
    undefined,
  );

  const masterTransport = new FakeTransport();
  const masterClient = createClient(
    new ApiSession({ gameAuthToken: undefined, masterVersion: "master" }),
    masterTransport,
  );
  await masterClient.call(MASTER_ONLY, undefined);
  assert.equal(
    masterTransport.requests[0]?.headers?.["x-app-auth-token"],
    undefined,
  );
  assert.equal(
    masterTransport.requests[0]?.headers?.["x-app-master-version"],
    "master",
  );
});

void test("fails closed when a method requires a request signer", async () => {
  const client = createClient(new ApiSession(), new FakeTransport());
  await assert.rejects(
    client.call(SIGNED, undefined),
    (error: unknown) =>
      error instanceof HolodoriApiError &&
      error.message.includes("no request signer"),
  );
});
