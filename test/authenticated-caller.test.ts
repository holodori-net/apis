import assert from "node:assert/strict";
import { test } from "vitest";

import { AuthenticatedApiCaller } from "../src/core/caller.js";
import { type ApiMethod } from "../src/core/method.js";

void test("bootstraps only for methods requiring game auth or master version", async () => {
  let authenticationCalls = 0;
  let requestCalls = 0;
  const caller = new AuthenticatedApiCaller(
    {
      call: () => {
        requestCalls += 1;
        return Promise.resolve("ok");
      },
    } as never,
    () => {
      authenticationCalls += 1;
      return Promise.resolve();
    },
  );
  const methods: ApiMethod<void, string>[] = [
    {
      path: "/rpc.api.Test/GameAuth",
      requiresGameAuth: true,
      requiresMasterVersion: false,
      usesResponseCache: false,
      requiresRequestSignature: false,
      encode: () => Buffer.alloc(0),
      decode: () => "ok",
    },
    {
      path: "/rpc.api.Test/MasterVersion",
      requiresGameAuth: false,
      requiresMasterVersion: true,
      usesResponseCache: false,
      requiresRequestSignature: false,
      encode: () => Buffer.alloc(0),
      decode: () => "ok",
    },
    {
      path: "/rpc.api.Test/Public",
      requiresGameAuth: false,
      requiresMasterVersion: false,
      usesResponseCache: true,
      requiresRequestSignature: true,
      encode: () => Buffer.alloc(0),
      decode: () => "ok",
    },
  ];

  for (const method of methods) await caller.call(method, undefined);

  assert.equal(authenticationCalls, 2);
  assert.equal(requestCalls, 3);
});
