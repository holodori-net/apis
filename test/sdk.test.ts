import assert from "node:assert/strict";
import { test } from "vitest";

import {
  type ApiTransport,
  type ApiTransportRequest,
  type ApiTransportResponse,
  AssetApi,
  decodeProtoFields,
  decryptProto,
  encodeMessage,
  encodeStringField,
  encodeVarintField,
  encryptProto,
  HealthApi,
  HealthCheckServingStatus,
  HolodoriApi,
  MarathonApi,
  MusicApi,
  ProfileApi,
} from "../src/index.js";

const SECRET = "test-api-secret";

class FakeTransport implements ApiTransport {
  readonly requests: ApiTransportRequest[] = [];
  private readonly responses = new Map<string, Buffer[]>();

  respond(path: string, ...messages: Buffer[]): void {
    this.responses.set(
      path,
      messages.map((message) =>
        encryptProto(message, SECRET, 638000000000000000n),
      ),
    );
  }

  request(request: ApiTransportRequest): Promise<ApiTransportResponse> {
    this.requests.push(request);
    const path = new URL(request.url).pathname;
    const body = request.body ?? Buffer.alloc(0);
    const plaintext = decryptProto(body, SECRET);
    if (path === "/rpc.api.Auth/Login") {
      assert.equal(
        decodeProtoFields(plaintext).get(1)?.[0]?.toString(),
        "credential-1",
      );
    }
    const queue = this.responses.get(path);
    if (!queue?.length) throw new Error(`no fake response for ${path}`);
    const responseBody = queue.shift()!;
    return Promise.resolve({
      status: 200,
      headers: {},
      trailers: { "grpc-status": "0" },
      body: responseBody,
    });
  }
}

void test("bootstraps authentication and decodes all Notice endpoints", async () => {
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
  const notice = encodeMessage(
    encodeStringField(1, "notice-1"),
    encodeStringField(2, "Title"),
    encodeVarintField(3, 4),
    encodeStringField(4, "https://detail.example/1"),
    encodeVarintField(6, 1),
    encodeVarintField(7, 1_700_000_000_000n),
  );
  const validCategory = encodeMessage(
    encodeStringField(1, "category-1"),
    encodeStringField(2, "一覽"),
    encodeVarintField(3, 1),
    encodeLengthDelimitedField(4, notice),
    encodeVarintField(5, 1),
  );
  transport.respond(
    "/rpc.api.Notice/Top",
    encodeMessage(encodeLengthDelimitedField(1, validCategory)),
  );
  transport.respond(
    "/rpc.api.Notice/ListInCategory",
    encodeMessage(
      encodeLengthDelimitedField(1, notice),
      encodeVarintField(5, 1),
    ),
  );
  transport.respond(
    "/rpc.api.Notice/Get",
    encodeMessage(encodeLengthDelimitedField(1, notice)),
  );
  transport.respond("/rpc.api.Notice/UpdateCategoryReadTime", Buffer.alloc(0));
  transport.respond("/rpc.api.Notice/UpdateDetailReadTime", Buffer.alloc(0));

  const api = await HolodoriApi.create(
    {
      appVersion: "1.1.0",
      apiSecret: SECRET,
      requestIdFactory: () => "request-1",
    },
    transport,
  );
  assert.equal(api.getCredential(), "credential-1");
  assert.equal(api.getGameAuthToken(), "token-1");
  assert.equal(api.getMasterVersion(), "master-1");

  const top = await api.notice.top();
  assert.equal(top.categories[0]?.noticeCategoryId, "category-1");
  assert.equal(top.categories[0]?.noticeInfos.length, 1);
  assert.equal(
    top.categories[0]?.noticeInfos[0]?.startTime,
    1_700_000_000_000n,
  );

  const list = await api.notice.listInCategory("category-1", 30);
  assert.equal(list.noticeInfos[0]?.id, "notice-1");
  assert.equal(list.isHasNext, true);
  assert.equal((await api.notice.get("notice-1")).noticeInfo.title, "Title");
  await api.notice.updateCategoryReadTime(["category-1"]);
  await api.notice.updateDetailReadTime(["notice-1"]);

  const noticeRequest = transport.requests.find(
    (request) => new URL(request.url).pathname === "/rpc.api.Notice/Top",
  );
  assert.equal(noticeRequest?.headers?.["x-app-auth-token"], "token-1");
  assert.equal(noticeRequest?.headers?.["x-app-master-version"], "master-1");
  assert.equal(noticeRequest?.headers?.["x-app-request-id"], "request-1");
});

void test("generates decimal .NET tick request IDs by default", async () => {
  const transport = new FakeTransport();
  transport.respond("/rpc.api.Notice/Top", encodeMessage());
  const api = await HolodoriApi.create(
    {
      appVersion: "1.1.0",
      apiSecret: SECRET,
      gameAuthToken: "token-1",
      masterVersion: "master-1",
      autoAuthenticate: false,
    },
    transport,
  );
  const controller = new AbortController();
  await api.notice.top({ signal: controller.signal, timeoutMs: 1_500 });

  assert.deepEqual(
    transport.requests.map(({ signal, timeoutMs }) => ({ signal, timeoutMs })),
    [{ signal: controller.signal, timeoutMs: 1_500 }],
  );
  const requestId = transport.requests[0]?.headers?.["x-app-request-id"];
  assert.match(requestId ?? "", /^\d{18}$/);
});

void test("can defer bootstrap and reuse supplied session values", async () => {
  const transport = new FakeTransport();
  transport.respond("/rpc.api.Notice/Top", encodeMessage());
  const api = await HolodoriApi.create(
    {
      appVersion: "1.1.0",
      apiSecret: SECRET,
      gameAuthToken: "token-1",
      masterVersion: "master-1",
      autoAuthenticate: false,
    },
    transport,
  );
  await api.notice.top();
  assert.equal(transport.requests.length, 1);
  assert.equal(
    new URL(transport.requests[0]!.url).pathname,
    "/rpc.api.Notice/Top",
  );
});

void test("lazily bootstraps authentication for a Notice call", async () => {
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
  transport.respond("/rpc.api.Notice/Top", encodeMessage());

  const api = await HolodoriApi.create(
    {
      appVersion: "1.1.0",
      apiSecret: SECRET,
      autoAuthenticate: false,
    },
    transport,
  );
  const controller = new AbortController();
  await api.notice.top({ signal: controller.signal, timeoutMs: 1_500 });

  assert.deepEqual(
    transport.requests.map((request) => new URL(request.url).pathname),
    [
      "/rpc.api.Auth/Create",
      "/rpc.api.Auth/Login",
      "/rpc.api.Master/Get",
      "/rpc.api.Notice/Top",
    ],
  );
  assert.deepEqual(
    transport.requests.map(({ signal, timeoutMs }) => ({ signal, timeoutMs })),
    [
      { signal: undefined, timeoutMs: 30_000 },
      { signal: undefined, timeoutMs: 30_000 },
      { signal: undefined, timeoutMs: 30_000 },
      { signal: controller.signal, timeoutMs: 1_500 },
    ],
  );
});

void test("validates Notice request contracts", async () => {
  const transport = new FakeTransport();
  transport.respond("/rpc.api.Notice/Top", encodeMessage());
  const api = await HolodoriApi.create(
    {
      appVersion: "1.1.0",
      apiSecret: SECRET,
      gameAuthToken: "token-1",
      masterVersion: "master-1",
      autoAuthenticate: false,
    },
    transport,
  );
  await assert.rejects(api.notice.listInCategory("", 0), /category ID/);
  await assert.rejects(api.notice.listInCategory("category-1", -1), /offset/);
  await assert.rejects(
    api.notice.updateDetailReadTime(["notice-1", "notice-1"]),
    /unique/,
  );
});

void test("adds caller-owned device headers without allowing core header overrides", async () => {
  const transport = new FakeTransport();
  transport.respond("/rpc.api.Notice/Top", encodeMessage());
  const api = await HolodoriApi.create(
    {
      appVersion: "1.1.0",
      apiSecret: SECRET,
      gameAuthToken: "token-1",
      masterVersion: "master-1",
      autoAuthenticate: false,
      additionalHeaders: {
        "x-app-device-name": "test-device",
        "x-app-version": "must-not-win",
      },
    },
    transport,
  );
  await api.notice.top();
  assert.equal(
    transport.requests[0]?.headers?.["x-app-device-name"],
    "test-device",
  );
  assert.equal(transport.requests[0]?.headers?.["x-app-version"], "1.1.0");
});

void test("exposes public information services from the high-level client", async () => {
  const api = await HolodoriApi.create(
    {
      appVersion: "1.1.0",
      apiSecret: SECRET,
      autoAuthenticate: false,
    },
    new FakeTransport(),
  );

  assert.ok(api.asset instanceof AssetApi);
  assert.ok(api.health instanceof HealthApi);
  assert.equal(HealthCheckServingStatus.Serving, 1);
  assert.ok(api.marathon instanceof MarathonApi);
  assert.ok(api.music instanceof MusicApi);
  assert.ok(api.profile instanceof ProfileApi);
});

function encodeLengthDelimitedField(field: number, value: Buffer): Buffer {
  return Buffer.concat([
    encodeVarint(BigInt(field * 8 + 2)),
    encodeVarint(value.length),
    value,
  ]);
}

function encodeVarint(value: bigint | number): Buffer {
  let current = typeof value === "number" ? BigInt(value) : value;
  const bytes: number[] = [];
  do {
    const byte = Number(current & 0x7fn);
    current >>= 7n;
    bytes.push(current === 0n ? byte : byte | 0x80);
  } while (current !== 0n);
  return Buffer.from(bytes);
}
