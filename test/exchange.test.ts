import assert from "node:assert/strict";
import { test } from "vitest";

import {
  decodeExchangeListResponse,
  encodeExchangeListRequest,
} from "../src/codecs/exchange.js";
import {
  decodeProtoFields,
  encodeBytesField,
  encodeMessage,
  encodeStringField,
  encodeVarintField,
} from "../src/low-level.js";
import { EXCHANGE_LIST, ExchangeApi } from "../src/services/exchange.js";

void test("encodes Exchange/List booth group ID", () => {
  assert.equal(
    decodeProtoFields(encodeExchangeListRequest("membership-group"))
      .get(1)?.[0]
      ?.toString(),
    "membership-group",
  );
  assert.throws(() => encodeExchangeListRequest(""), /exchange booth group ID/);
});

void test("decodes booth items, costs, rewards, schedules, and int64 values", () => {
  const response = encodeMessage(
    encodeStringField(1, "membership-group"),
    encodeStringField(2, "Membership Exchange"),
    encodeBytesField(
      3,
      encodeMessage(
        encodeStringField(1, "booth-1"),
        encodeStringField(2, "Main"),
        encodeVarintField(3, 2),
        encodeBytesField(
          4,
          encodeMessage(
            encodeVarintField(1, 2),
            encodeStringField(2, "item-1"),
            encodeStringField(3, "Card"),
            encodeStringField(4, "thumb-1"),
            encodeVarintField(5, 10),
            encodeVarintField(6, 2),
            encodeBytesField(
              7,
              encodeMessage(
                encodeVarintField(1, 3),
                encodeStringField(2, "coin-1"),
                encodeVarintField(3, 3_000_000_000n),
                encodeVarintField(4, 4_000_000_000n),
                encodeVarintField(5, 250),
              ),
            ),
            encodeBytesField(
              8,
              encodeMessage(
                encodeVarintField(1, 2),
                encodeStringField(2, "card-1"),
                encodeVarintField(3, 1n),
              ),
            ),
            encodeVarintField(9, 9_000_000_000n),
            encodeVarintField(10, 8_000_000_000n),
            encodeVarintField(11, 1),
            encodeStringField(12, "condition-group"),
            encodeStringField(13, "Exchange description"),
            encodeVarintField(14, 2),
            encodeVarintField(15, 7_000_000_000n),
          ),
        ),
        encodeVarintField(5, 6_000_000_000n),
        encodeVarintField(6, 5_000_000_000n),
        encodeVarintField(7, 1),
        encodeStringField(8, "booth-condition"),
      ),
    ),
    encodeStringField(4, "background"),
    encodeStringField(5, "header"),
    encodeStringField(6, "logo"),
    encodeStringField(7, "#123456"),
    encodeStringField(8, "#654321"),
    encodeStringField(9, "icon"),
    encodeStringField(100, "#1"),
    encodeStringField(101, "#2"),
    encodeStringField(102, "#3"),
    encodeStringField(103, "#4"),
  );

  assert.deepEqual(decodeExchangeListResponse(response), {
    id: "membership-group",
    name: "Membership Exchange",
    booths: [
      {
        id: "booth-1",
        name: "Main",
        type: 2,
        items: [
          {
            type: 2,
            id: "item-1",
            name: "Card",
            thumbnailAssetId: "thumb-1",
            limitQuantity: 10,
            purchasedQuantity: 2,
            consumptions: [
              {
                resourceType: 3,
                resourceId: "coin-1",
                quantity: 3_000_000_000n,
                originalQuantity: 4_000_000_000n,
                discountRatioPermil: 250,
              },
            ],
            rewards: [{ resourceType: 2, resourceId: "card-1", quantity: 1n }],
            nextResetTime: 9_000_000_000n,
            endTime: 8_000_000_000n,
            isLocked: true,
            unlockConditionGroupId: "condition-group",
            description: "Exchange description",
            resetIntervalType: 2,
            releaseTime: 7_000_000_000n,
          },
        ],
        nextResetTime: 6_000_000_000n,
        endTime: 5_000_000_000n,
        isLocked: true,
        unlockConditionGroupId: "booth-condition",
      },
    ],
    backgroundAssetId: "background",
    headerAssetId: "header",
    logoAssetId: "logo",
    pegboardColor: "#123456",
    hookColor: "#654321",
    iconAssetId: "icon",
    color1: "#1",
    color2: "#2",
    color3: "#3",
    color4: "#4",
  });
});

void test("ExchangeApi authenticates lazily and declares read policies", async () => {
  let authCalls = 0;
  const calls: string[] = [];
  const api = new ExchangeApi(
    {
      call: (method: { path: string }, request: { boothGroupId: string }) => {
        calls.push(`${method.path}:${request.boothGroupId}`);
        return Promise.resolve({ id: request.boothGroupId });
      },
    } as never,
    () => {
      authCalls += 1;
      return Promise.resolve();
    },
  );
  await api.list("membership-group");
  assert.equal(authCalls, 1);
  assert.deepEqual(calls, ["/rpc.api.Exchange/List:membership-group"]);
  assert.equal(EXCHANGE_LIST.requiresGameAuth, true);
  assert.equal(EXCHANGE_LIST.requiresMasterVersion, true);
  assert.equal(EXCHANGE_LIST.usesResponseCache, true);
  assert.equal(EXCHANGE_LIST.requiresRequestSignature, false);
});
