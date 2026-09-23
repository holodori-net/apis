import assert from "node:assert/strict";
import { test, vi } from "vitest";

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
  ApiTransportError,
  type ApiTransportRequest,
  type ApiTransportResponse,
} from "../src/transports/index.js";

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

const CACHED: ApiMethod<void, string> = {
  path: "/rpc.api.Test/Cached",
  requiresGameAuth: false,
  requiresMasterVersion: false,
  usesResponseCache: true,
  requiresRequestSignature: false,
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

void test("passes per-call signal and timeout while retaining the client default", async () => {
  const transport = new FakeTransport();
  const client = createClient(new ApiSession(), transport);
  const controller = new AbortController();

  await client.call(CACHED, undefined);
  await client.call(CACHED, undefined, {
    signal: controller.signal,
    timeoutMs: 1_250,
  });

  assert.equal(transport.requests[0]?.timeoutMs, 30_000);
  assert.equal(transport.requests[0]?.signal, undefined);
  assert.equal(transport.requests[1]?.timeoutMs, 1_250);
  assert.equal(transport.requests[1]?.signal, controller.signal);
});

void test("rejects an invalid per-call timeout before calling the transport", async () => {
  const transport = new FakeTransport();
  const client = createClient(new ApiSession(), transport);

  await assert.rejects(
    client.call(CACHED, undefined, { timeoutMs: Number.POSITIVE_INFINITY }),
    (error: unknown) =>
      error instanceof HolodoriApiError && error.kind === "configuration",
  );
  assert.equal(transport.requests.length, 0);
});

void test("creates monotonic request IDs from local DateTime ticks", async () => {
  const now = 1_700_000_000_000;
  vi.spyOn(Date, "now").mockReturnValue(now);
  vi.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(-480);
  const transport = new FakeTransport();
  const client = createClient(new ApiSession(), transport);

  await client.call(CACHED, undefined);
  await client.call(CACHED, undefined);

  const ticks = BigInt(now + 480 * 60_000) * 10_000n + 621_355_968_000_000_000n;
  assert.equal(
    transport.requests[0]?.headers?.["x-app-request-id"],
    ticks.toString(),
  );
  assert.equal(
    transport.requests[1]?.headers?.["x-app-request-id"],
    (ticks + 1n).toString(),
  );
  vi.restoreAllMocks();
});

void test("classifies transport failures with their phase and cause", async () => {
  const transportError = new ApiTransportError("tunnel failed", "ssh");
  const transport: ApiTransport = {
    request: () => Promise.reject(transportError),
  };
  const client = createClient(new ApiSession(), transport as FakeTransport);

  await assert.rejects(client.call(CACHED, undefined), (error: unknown) => {
    assert.ok(error instanceof HolodoriApiError);
    assert.equal(error.kind, "transport");
    assert.equal(error.rpcPath, CACHED.path);
    assert.equal(error.transportPhase, "ssh");
    assert.equal(error.cause, transportError);
    assert.ok(error.requestId);
    return true;
  });
});

void test("classifies HTTP and gRPC response failures", async () => {
  const httpClient = createClient(new ApiSession(), {
    requests: [],
    request: () =>
      Promise.resolve({
        status: 503,
        headers: {},
        trailers: {},
        body: Buffer.alloc(0),
      }),
  });
  await assert.rejects(httpClient.call(CACHED, undefined), (error: unknown) => {
    assert.ok(error instanceof HolodoriApiError);
    assert.equal(error.kind, "http");
    assert.equal(error.httpStatus, 503);
    assert.equal(error.status, 503);
    assert.equal(error.path, CACHED.path);
    return true;
  });

  const grpcClient = createClient(new ApiSession(), {
    requests: [],
    request: () =>
      Promise.resolve({
        status: 200,
        headers: {},
        trailers: { "grpc-status": "3", "grpc-message": "bad%20request" },
        body: Buffer.alloc(0),
      }),
  });
  await assert.rejects(grpcClient.call(CACHED, undefined), (error: unknown) => {
    assert.ok(error instanceof HolodoriApiError);
    assert.equal(error.kind, "grpc");
    assert.equal(error.grpcStatus, 3);
    assert.match(error.message, /bad request/);
    return true;
  });
});

void test("classifies malformed successful responses as protocol failures", async () => {
  const client = createClient(new ApiSession(), {
    requests: [],
    request: () =>
      Promise.resolve({
        status: 200,
        headers: {},
        trailers: { "grpc-status": "0" },
        body: Buffer.from([0]),
      }),
  });

  await assert.rejects(client.call(CACHED, undefined), (error: unknown) => {
    assert.ok(error instanceof HolodoriApiError);
    assert.equal(error.kind, "protocol");
    assert.ok(error.cause instanceof Error);
    return true;
  });
});
