import assert from "node:assert/strict";
import { test } from "vitest";

import { encodeProtobuf } from "../src/protos/codec.js";
import { HomeLoginResponseSchema } from "../src/protos/gen/rpc/api/home.gen_pb.js";
import { HOME_LOGIN, HomeApi } from "../src/services/home.js";
import { authenticatedCaller } from "./support/authenticated-caller.js";

void test("decodes the complete Home/Login response", () => {
  const response = encodeProtobuf(HomeLoginResponseSchema, {
    ruleTypes: [1, 2, 3],
    fcmTopics: ["topic-a"],
    realtimeNotificationConnectionInfo: {
      sseToken: "sse-token",
      sseUrl: "https://sse.example",
    },
    asyncUpdateResultInfo: {},
    expiredResourceResult: {
      expiredResources: [
        { resourceType: 0, resourceId: "resource-1", quantity: 7n },
      ],
      rewardResults: [],
    },
  });

  const decoded = HOME_LOGIN.decode(response);
  assert.deepEqual(decoded.ruleTypes, [1, 2, 3]);
  assert.deepEqual(decoded.fcmTopics, ["topic-a"]);
  assert.equal(
    decoded.realtimeNotificationConnectionInfo?.sseUrl,
    "https://sse.example",
  );
  assert.ok(decoded.asyncUpdateResultInfo);
  assert.equal(
    decoded.expiredResourceResult?.expiredResources[0]?.resourceId,
    "resource-1",
  );
});

void test("HomeApi authenticates and declares cached bootstrap policies", async () => {
  let authenticationCalls = 0;
  const calls: string[] = [];
  const api = new HomeApi(
    authenticatedCaller(
      {
        call: (method: { path: string }) => {
          calls.push(method.path);
          return Promise.resolve({
            $typeName: "rpc.api.HomeLoginResponse",
            fcmTopics: [],
            ruleTypes: [],
            asyncUpdateResultInfo: undefined,
            expiredResourceResult: undefined,
          });
        },
      } as never,
      () => {
        authenticationCalls += 1;
        return Promise.resolve();
      },
    ),
  );

  await api.login();

  assert.equal(authenticationCalls, 1);
  assert.deepEqual(calls, ["/rpc.api.Home/Login"]);
  assert.equal(HOME_LOGIN.requiresGameAuth, true);
  assert.equal(HOME_LOGIN.requiresMasterVersion, true);
  assert.equal(HOME_LOGIN.usesResponseCache, true);
  assert.equal(HOME_LOGIN.requiresRequestSignature, false);
});
