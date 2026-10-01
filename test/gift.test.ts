import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { test } from "vitest";

import {
  decodeProtoFields,
  encodeBytesField,
  encodeMessage,
  encodeStringField,
  encodeVarintField,
} from "../src/low-level.js";
import {
  GIFT_LIST,
  GIFT_LIST_HISTORY,
  GIFT_TOP,
  GiftApi,
  GiftSortType,
} from "../src/services/gift.js";
import { authenticatedCaller } from "./support/authenticated-caller.js";
import { withoutTypeNames } from "./support/without-type-names.js";

void test("encodes Gift/List request fields and validates them", () => {
  const encoded = GIFT_LIST.encode({
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
      GIFT_LIST.encode({
        offset: -1,
        sortType: GiftSortType.PostedTime,
        isDesc: false,
      }),
    /offset/,
  );
  assert.throws(
    () =>
      GIFT_LIST.encode({
        offset: 2_147_483_648,
        sortType: GiftSortType.PostedTime,
        isDesc: false,
      }),
    /offset/,
  );
  assert.throws(
    () =>
      GIFT_LIST.encode({
        offset: 0,
        sortType: 0,
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
    withoutTypeNames(
      GIFT_LIST.decode(
        encodeMessage(
          encodeBytesField(1, gift),
          encodeVarintField(2, 35),
          encodeVarintField(3, 1),
        ),
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

void test("Gift Top and ListHistory use empty requests and decode nested account data", () => {
  assert.deepEqual([...GIFT_TOP.encode(undefined)], []);
  assert.deepEqual([...GIFT_LIST_HISTORY.encode(undefined)], []);
  const bigQuantity = 9_007_199_254_740_993n;
  const openedTime = 1_900_000_000_000n;
  assert.deepEqual(
    withoutTypeNames(
      GIFT_TOP.decode(
        encodeMessage(
          encodeBytesField(
            1,
            encodeMessage(
              encodeStringField(1, "gift-top"),
              encodeVarintField(2, 4),
              encodeStringField(3, "gem"),
              encodeVarintField(4, bigQuantity),
            ),
          ),
          encodeVarintField(2, 1),
          encodeVarintField(3, 1),
          encodeVarintField(4, 2),
        ),
      ),
    ),
    {
      items: [
        {
          giftId: "gift-top",
          resourceType: 4,
          resourceId: "gem",
          quantity: bigQuantity,
          description: "",
          postedTime: 0n,
          limitTime: 0n,
        },
      ],
      count: 1,
      isNext: true,
      unreadAnnouncementCount: 2,
    },
  );
  assert.deepEqual(
    withoutTypeNames(
      GIFT_LIST_HISTORY.decode(
        encodeMessage(
          encodeBytesField(
            1,
            encodeMessage(
              encodeVarintField(1, 4),
              encodeStringField(2, "gem"),
              encodeVarintField(3, bigQuantity),
              encodeStringField(4, "Opened gift"),
              encodeVarintField(5, openedTime),
            ),
          ),
        ),
      ),
    ),
    {
      items: [
        {
          resourceType: 4,
          resourceId: "gem",
          quantity: bigQuantity,
          description: "Opened gift",
          openedTime,
        },
      ],
    },
  );
  assert.deepEqual(withoutTypeNames(GIFT_TOP.decode(Buffer.alloc(0))), {
    items: [],
    count: 0,
    isNext: false,
    unreadAnnouncementCount: 0,
  });
  assert.deepEqual(
    withoutTypeNames(GIFT_LIST_HISTORY.decode(Buffer.alloc(0))),
    {
      items: [],
    },
  );
});

void test("Gift Top and ListHistory authenticate, forward options, and declare policies", async () => {
  const calls: { path: string; request: unknown; options: unknown }[] = [];
  const client = {
    call: (method: { path: string }, request: unknown, options: unknown) => {
      calls.push({ path: method.path, request, options });
      return Promise.resolve({
        items: [],
        count: 0,
        isNext: false,
        unreadAnnouncementCount: 0,
      });
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
  await api.top(options);
  await api.listHistory(options);

  assert.equal(authCalls, 2);
  assert.deepEqual(calls, [
    { path: "/rpc.api.Gift/Top", request: undefined, options },
    { path: "/rpc.api.Gift/ListHistory", request: undefined, options },
  ]);
  for (const method of [GIFT_TOP, GIFT_LIST_HISTORY]) {
    assert.equal(method.requiresGameAuth, true);
    assert.equal(method.requiresMasterVersion, true);
    assert.equal(method.usesResponseCache, true);
    assert.equal(method.requiresRequestSignature, false);
  }
});
