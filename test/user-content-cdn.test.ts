import assert from "node:assert/strict";
import { test } from "vitest";

import {
  type ApiTransport,
  type ApiTransportRequest,
  type ApiTransportResponse,
  decodeProtoFields,
  decryptProto,
  encodeBytesField,
  encodeMessage,
  encodeStringField,
  encodeVarintField,
  encryptProto,
  HolodoriApi,
  UserContentCdnApi,
} from "../src/index.js";
import { USER_CONTENT_CDN_GET_SIGNED_COOKIE } from "../src/services/user-content-cdn.js";
import { authenticatedCaller } from "./support/authenticated-caller.js";
import { withoutTypeNames } from "./support/without-type-names.js";

const SECRET = "test-api-secret";

void test("decodes signed cookie fields and proto defaults", () => {
  const response = USER_CONTENT_CDN_GET_SIGNED_COOKIE.decode(
    encodeMessage(
      encodeBytesField(
        1,
        encodeMessage(
          encodeStringField(1, "cookie-policy"),
          encodeStringField(2, "cookie-signature"),
          encodeStringField(3, "cdn-key"),
          encodeVarintField(4, 1_800_000_000_000n),
        ),
      ),
    ),
  );

  assert.deepEqual(withoutTypeNames(response), {
    signedCookie: {
      policy: "cookie-policy",
      signature: "cookie-signature",
      keyName: "cdn-key",
      expiredTimeMilliseconds: 1_800_000_000_000n,
    },
  });
  assert.deepEqual(
    withoutTypeNames(
      USER_CONTENT_CDN_GET_SIGNED_COOKIE.decode(Buffer.alloc(0)),
    ),
    {},
  );
});

void test("encodes Empty, authenticates, forwards options, and declares policies", async () => {
  let ensured = false;
  let receivedOptions: unknown;
  const api = new UserContentCdnApi(
    authenticatedCaller(
      {
        call: (
          method: { path: string; encode: (request: unknown) => Buffer },
          request: unknown,
          options: unknown,
        ) => {
          assert.equal(method.path, "/rpc.api.UserContentCdn/GetSignedCookie");
          assert.equal(request, undefined);
          assert.deepEqual(method.encode(request), Buffer.alloc(0));
          receivedOptions = options;
          return Promise.resolve({});
        },
      } as never,
      () => {
        ensured = true;
        return Promise.resolve();
      },
    ),
  );
  const options = { timeoutMs: 2_000 };

  await api.getSignedCookie(options);
  assert.equal(ensured, true);
  assert.equal(receivedOptions, options);
  assert.equal(USER_CONTENT_CDN_GET_SIGNED_COOKIE.requiresGameAuth, true);
  assert.equal(USER_CONTENT_CDN_GET_SIGNED_COOKIE.requiresMasterVersion, false);
  assert.equal(USER_CONTENT_CDN_GET_SIGNED_COOKIE.usesResponseCache, false);
  assert.equal(
    USER_CONTENT_CDN_GET_SIGNED_COOKIE.requiresRequestSignature,
    false,
  );
});

void test("is callable from HolodoriApi with a mock transport", async () => {
  const transport = new SignedCookieTransport();
  const api = new HolodoriApi(
    {
      appVersion: "1.2.0",
      apiSecret: SECRET,
      credential: "credential-1",
      gameAuthToken: "game-token",
      masterVersion: "master-1",
      autoAuthenticate: false,
      requestIdFactory: () => "request-1",
    },
    transport,
  );
  const options = { timeoutMs: 1_500 };
  const response = await api.userContentCdn.getSignedCookie(options);

  assert.equal(response.signedCookie?.policy, "cookie-policy");
  assert.equal(response.signedCookie?.signature, "cookie-signature");
  assert.equal(response.signedCookie?.keyName, "cdn-key");
  assert.equal(
    response.signedCookie?.expiredTimeMilliseconds,
    1_800_000_000_000n,
  );
  assert.equal(transport.requests.length, 1);
  const request = transport.requests[0]!;
  assert.equal(request.timeoutMs, options.timeoutMs);
  assert.equal(request.headers?.["x-app-auth-token"], "game-token");
  assert.equal(request.headers?.["x-app-master-version"], undefined);
  assert.equal(request.headers?.["x-app-request-id"], undefined);
  assert.deepEqual(
    decodeProtoFields(decryptProto(request.body ?? Buffer.alloc(0), SECRET)),
    new Map(),
  );
});

class SignedCookieTransport implements ApiTransport {
  readonly requests: ApiTransportRequest[] = [];

  request(request: ApiTransportRequest): Promise<ApiTransportResponse> {
    this.requests.push(request);
    const body = encryptProto(
      encodeMessage(
        encodeBytesField(
          1,
          encodeMessage(
            encodeStringField(1, "cookie-policy"),
            encodeStringField(2, "cookie-signature"),
            encodeStringField(3, "cdn-key"),
            encodeVarintField(4, 1_800_000_000_000n),
          ),
        ),
      ),
      SECRET,
      638000000000000000n,
    );
    return Promise.resolve({
      status: 200,
      headers: {},
      trailers: { "grpc-status": "0" },
      body,
    });
  }
}

void test("exports UserContentCdnApi from the package entrypoint", () => {
  assert.equal(typeof UserContentCdnApi, "function");
});
