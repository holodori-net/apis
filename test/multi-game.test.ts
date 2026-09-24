import assert from "node:assert/strict";
import { test } from "vitest";

import {
  encodeBytesField,
  encodeMessage,
  encodeStringField,
} from "../src/low-level.js";
import {
  MULTI_GAME_LIST_PING_SERVER,
  MultiGameApi,
} from "../src/services/multi-game.js";
import { authenticatedCaller } from "./support/authenticated-caller.js";
import { withoutTypeNames } from "./support/without-type-names.js";

void test("encodes an empty MultiGame/ListPingServer request", () => {
  assert.equal(MULTI_GAME_LIST_PING_SERVER.encode(undefined).length, 0);
});

void test("decodes all advertised ping server fields", () => {
  const server = encodeMessage(
    encodeStringField(1, "jp"),
    encodeStringField(2, "ping.example.invalid:443"),
  );
  assert.deepEqual(
    withoutTypeNames(
      MULTI_GAME_LIST_PING_SERVER.decode(encodeBytesField(1, server)),
    ),
    {
      servers: [{ region: "jp", endpoint: "ping.example.invalid:443" }],
    },
  );
});

void test("ListPingServer authenticates, forwards options, and declares policies", async () => {
  const calls: { path: string; request: unknown; options: unknown }[] = [];
  const client = {
    call: (method: { path: string }, request: unknown, options: unknown) => {
      calls.push({ path: method.path, request, options });
      return Promise.resolve({ servers: [] });
    },
  };
  let authCalls = 0;
  const api = new MultiGameApi(
    authenticatedCaller(client as never, () => {
      authCalls += 1;
      return Promise.resolve();
    }),
  );
  const options = { timeoutMs: 1_000 };
  await api.listPingServer(options);

  assert.equal(authCalls, 1);
  assert.deepEqual(calls, [
    {
      path: "/rpc.api.MultiGame/ListPingServer",
      request: undefined,
      options,
    },
  ]);
  assert.equal(MULTI_GAME_LIST_PING_SERVER.requiresGameAuth, true);
  assert.equal(MULTI_GAME_LIST_PING_SERVER.requiresMasterVersion, false);
  assert.equal(MULTI_GAME_LIST_PING_SERVER.usesResponseCache, true);
  assert.equal(MULTI_GAME_LIST_PING_SERVER.requiresRequestSignature, false);
});
