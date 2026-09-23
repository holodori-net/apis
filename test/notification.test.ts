import assert from "node:assert/strict";
import { test } from "vitest";

import { decodeNotificationListResponse } from "../src/codecs/notification.js";
import {
  decodeProtoFields,
  encodeBytesField,
  encodeMessage,
  encodeStringField,
  encodeVarintField,
} from "../src/low-level.js";
import {
  NOTIFICATION_LIST,
  NotificationApi,
} from "../src/services/notification.js";
import { authenticatedCaller } from "./support/authenticated-caller.js";

void test("decodes account notification flags and updated Park exchange groups", () => {
  const response = encodeMessage(
    encodeVarintField(1, 1),
    encodeVarintField(2, 1),
    encodeVarintField(3, 1),
    encodeVarintField(4, 1),
    encodeVarintField(5, 1),
    encodeVarintField(6, 1),
    encodeBytesField(
      100,
      encodeMessage(
        encodeBytesField(
          1,
          encodeMessage(
            encodeStringField(1, "exchange-group"),
            encodeStringField(2, "Spring Exchange"),
          ),
        ),
      ),
    ),
  );
  assert.deepEqual(decodeNotificationListResponse(response), {
    isGachaUnread: true,
    isNoticeUnread: true,
    isFriendOfferReceived: true,
    isFriendExists: true,
    isMembershipUnread: true,
    isShopItemUnread: true,
    parkNotificationInfo: {
      updatedExchangeBoothGroups: [
        { groupId: "exchange-group", name: "Spring Exchange" },
      ],
    },
  });
});

void test("Notification API authenticates and uses its declared transport policy", async () => {
  const calls: string[] = [];
  const client = {
    call: (method: { path: string }, request: unknown) => {
      calls.push(`${method.path}:${request === undefined}`);
      return Promise.resolve({
        isGachaUnread: false,
        isNoticeUnread: false,
        isFriendOfferReceived: false,
        isFriendExists: false,
        isMembershipUnread: false,
        isShopItemUnread: false,
      });
    },
  };
  let authenticationCalls = 0;
  const api = new NotificationApi(
    authenticatedCaller(client as never, () => {
      authenticationCalls += 1;
      return Promise.resolve();
    }),
  );

  await api.list();

  assert.equal(authenticationCalls, 1);
  assert.deepEqual(calls, ["/rpc.api.Notification/List:true"]);
  assert.equal(NOTIFICATION_LIST.requiresGameAuth, true);
  assert.equal(NOTIFICATION_LIST.requiresMasterVersion, true);
  assert.equal(NOTIFICATION_LIST.usesResponseCache, true);
  assert.equal(NOTIFICATION_LIST.requiresRequestSignature, false);
  assert.equal(NOTIFICATION_LIST.encode(undefined).length, 0);
  assert.equal(decodeProtoFields(NOTIFICATION_LIST.encode(undefined)).size, 0);
});
