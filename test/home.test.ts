import assert from "node:assert/strict";
import { test } from "vitest";

import { decodeHomeLoginResponse } from "../src/codecs/home.js";
import {
  encodeBytesField,
  encodeMessage,
  encodeStringField,
  encodeVarint,
  encodeVarintField,
} from "../src/low-level.js";
import { HOME_LOGIN, HomeApi } from "../src/services/home.js";

void test("decodes Home/Login startup fields", () => {
  const response = encodeMessage(
    encodeVarintField(3, 1),
    encodeBytesField(3, Buffer.concat([encodeVarint(2), encodeVarint(3)])),
    encodeStringField(5, "topic-a"),
    encodeBytesField(
      6,
      encodeMessage(
        encodeStringField(1, "sse-token"),
        encodeStringField(2, "https://sse.example"),
      ),
    ),
  );

  assert.deepEqual(decodeHomeLoginResponse(response), {
    ruleTypes: [1, 2, 3],
    fcmTopics: ["topic-a"],
    realtimeNotificationConnectionInfo: {
      sseToken: "sse-token",
      sseUrl: "https://sse.example",
    },
  });
});

void test("HomeApi authenticates and declares cached bootstrap policies", async () => {
  let authenticationCalls = 0;
  const calls: string[] = [];
  const api = new HomeApi(
    {
      call: (method: { path: string }) => {
        calls.push(method.path);
        return Promise.resolve({ fcmTopics: [], ruleTypes: [] });
      },
    } as never,
    () => {
      authenticationCalls += 1;
      return Promise.resolve();
    },
  );

  await api.login();

  assert.equal(authenticationCalls, 1);
  assert.deepEqual(calls, ["/rpc.api.Home/Login"]);
  assert.equal(HOME_LOGIN.requiresGameAuth, true);
  assert.equal(HOME_LOGIN.requiresMasterVersion, true);
  assert.equal(HOME_LOGIN.usesResponseCache, true);
  assert.equal(HOME_LOGIN.requiresRequestSignature, false);
});
