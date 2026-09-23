import assert from "node:assert/strict";
import { test } from "vitest";

import {
  decodeGiftListResponse,
  encodeGiftListRequest,
  GiftSortType,
} from "../src/codecs/gift.js";
import {
  decodeProtoFields,
  encodeBytesField,
  encodeMessage,
  encodeStringField,
  encodeVarintField,
} from "../src/low-level.js";
import { GIFT_LIST, GiftApi } from "../src/services/gift.js";
import { authenticatedCaller } from "./support/authenticated-caller.js";

void test("encodes Gift/List request fields and validates them", () => {
  const encoded = encodeGiftListRequest({
    offset: 20,
    sortType: GiftSortType.LimitTime,
    isDesc: true,
  });
  assert.deepEqual(
    [...decodeProtoFields(encoded)],
    [
      [1, [20n]],
      [2, [2n]],
      [3, [1n]],
    ],
  );
  assert.throws(
    () =>
      encodeGiftListRequest({
        offset: -1,
        sortType: GiftSortType.PostedTime,
        isDesc: false,
      }),
    /offset/,
  );
  assert.throws(
    () =>
      encodeGiftListRequest({
        offset: 2_147_483_648,
        sortType: GiftSortType.PostedTime,
        isDesc: false,
      }),
    /offset/,
  );
  assert.throws(
    () =>
      encodeGiftListRequest({
        offset: 0,
        sortType: 0 as GiftSortType,
        isDesc: false,
      }),
    /sortType/,
  );
});

void test("decodes every Gift/List business field", () => {
  const gift = encodeMessage(
    encodeStringField(1, "gift-1"),
    encodeVarintField(2, 3),
    encodeStringField(3, "resource-1"),
    encodeVarintField(4, 5_000_000_000n),
    encodeStringField(5, "Gift description"),
    encodeVarintField(6, 1_700_000_000_000n),
    encodeVarintField(7, 1_800_000_000_000n),
  );
  assert.deepEqual(
    decodeGiftListResponse(
      encodeMessage(
        encodeBytesField(1, gift),
        encodeVarintField(2, 35),
        encodeVarintField(3, 1),
      ),
    ),
    {
      items: [
        {
          giftId: "gift-1",
          resourceType: 3,
          resourceId: "resource-1",
          quantity: 5_000_000_000n,
          description: "Gift description",
          postedTime: 1_700_000_000_000n,
          limitTime: 1_800_000_000_000n,
        },
      ],
      count: 35,
      isNext: true,
    },
  );
});

void test("Gift/List authenticates, forwards options, and declares descriptor policies", async () => {
  const calls: { path: string; request: unknown; options: unknown }[] = [];
  const client = {
    call: (method: { path: string }, request: unknown, options: unknown) => {
      calls.push({ path: method.path, request, options });
      return Promise.resolve({ items: [], count: 0, isNext: false });
    },
  };
  let authCalls = 0;
  const api = new GiftApi(
    authenticatedCaller(client as never, () => {
      authCalls += 1;
      return Promise.resolve();
    }),
  );
  const options = { timeoutMs: 1_000 };
  await api.list(
    { offset: 0, sortType: GiftSortType.PostedTime, isDesc: true },
    options,
  );

  assert.equal(authCalls, 1);
  assert.deepEqual(calls, [
    {
      path: "/rpc.api.Gift/List",
      request: { offset: 0, sortType: GiftSortType.PostedTime, isDesc: true },
      options,
    },
  ]);
  assert.equal(GIFT_LIST.requiresGameAuth, true);
  assert.equal(GIFT_LIST.requiresMasterVersion, true);
  assert.equal(GIFT_LIST.usesResponseCache, true);
  assert.equal(GIFT_LIST.requiresRequestSignature, false);
});
