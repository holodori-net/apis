import assert from "node:assert/strict";
import { test } from "vitest";

import {
  decodeParkPermanenceListCharacterShopItemResponse,
  encodeParkPermanenceListCharacterShopItemRequest,
} from "../src/codecs/park-permanence.js";
import {
  encodeBytesField,
  encodeMessage,
  encodeStringField,
  encodeVarintField,
} from "../src/low-level.js";
import {
  PARK_PERMANENCE_LIST_CHARACTER_SHOP_ITEM,
  ParkPermanenceApi,
} from "../src/services/park-permanence.js";
import { authenticatedCaller } from "./support/authenticated-caller.js";

void test("encodes the complete Park permanence common request parameter", () => {
  const request = encodeMessage(
    encodeBytesField(
      1,
      encodeMessage(encodeStringField(1, "park-001"), encodeVarintField(2, 7)),
    ),
  );
  assert.deepEqual(
    encodeParkPermanenceListCharacterShopItemRequest({
      parkPermanenceId: "park-001",
      actionNumber: 7,
    }),
    request,
  );
  assert.throws(
    () =>
      encodeParkPermanenceListCharacterShopItemRequest({
        parkPermanenceId: "",
        actionNumber: 7,
      }),
    /park permanence ID/,
  );
  assert.throws(
    () =>
      encodeParkPermanenceListCharacterShopItemRequest({
        parkPermanenceId: "park-001",
        actionNumber: 0,
      }),
    /action number/,
  );
});

void test("decodes the full character shop response including collection state", () => {
  const reward = encodeMessage(
    encodeVarintField(1, 3),
    encodeStringField(2, "resource-001"),
    encodeVarintField(3, 5_000_000_000n),
  );
  const item = encodeMessage(
    encodeStringField(1, "shop-item-001"),
    encodeBytesField(2, reward),
    encodeStringField(3, "costume-001"),
    encodeStringField(4, "asset-001"),
  );
  const response = encodeMessage(
    encodeStringField(1, "Character Shop"),
    encodeBytesField(
      2,
      encodeMessage(
        encodeVarintField(1, 4),
        encodeStringField(2, "resource-cost-001"),
        encodeVarintField(3, 25n),
      ),
    ),
    encodeBytesField(
      3,
      encodeMessage(encodeBytesField(1, item), encodeVarintField(2, 1)),
    ),
    encodeBytesField(4, item),
  );

  assert.deepEqual(
    decodeParkPermanenceListCharacterShopItemResponse(response),
    {
      shopName: "Character Shop",
      consumption: {
        resourceType: 4,
        resourceId: "resource-cost-001",
        quantity: 25n,
      },
      itemInfos: [
        {
          item: {
            parkCharacterShopItemId: "shop-item-001",
            rewards: [
              {
                resourceType: 3,
                resourceId: "resource-001",
                quantity: 5_000_000_000n,
              },
            ],
            sdCostumeId: "costume-001",
            assetId: "asset-001",
          },
          isCollected: true,
        },
      ],
      pickedItems: [
        {
          parkCharacterShopItemId: "shop-item-001",
          rewards: [
            {
              resourceType: 3,
              resourceId: "resource-001",
              quantity: 5_000_000_000n,
            },
          ],
          sdCostumeId: "costume-001",
          assetId: "asset-001",
        },
      ],
    },
  );
});

void test("preserves absent optional nested fields and empty repeated fields", () => {
  assert.deepEqual(
    decodeParkPermanenceListCharacterShopItemResponse(
      encodeBytesField(3, encodeMessage(encodeVarintField(2, 0))),
    ),
    {
      shopName: "",
      itemInfos: [{ isCollected: false }],
      pickedItems: [],
    },
  );
});

void test("declares ListCharacterShopItem request policy", () => {
  assert.equal(
    PARK_PERMANENCE_LIST_CHARACTER_SHOP_ITEM.path,
    "/rpc.api.ParkPermanence/ListCharacterShopItem",
  );
  assert.equal(PARK_PERMANENCE_LIST_CHARACTER_SHOP_ITEM.requiresGameAuth, true);
  assert.equal(
    PARK_PERMANENCE_LIST_CHARACTER_SHOP_ITEM.requiresMasterVersion,
    true,
  );
  assert.equal(
    PARK_PERMANENCE_LIST_CHARACTER_SHOP_ITEM.usesResponseCache,
    true,
  );
  assert.equal(
    PARK_PERMANENCE_LIST_CHARACTER_SHOP_ITEM.requiresRequestSignature,
    false,
  );
});

void test("authenticates and passes request options for shop listing", async () => {
  let authenticated = false;
  let called = false;
  const options = { timeoutMs: 5_000 };
  const client = {
    call: (method: unknown, request: unknown, passedOptions: unknown) => {
      called = true;
      assert.equal(method, PARK_PERMANENCE_LIST_CHARACTER_SHOP_ITEM);
      assert.deepEqual(request, {
        parkPermanenceId: "park-001",
        actionNumber: 7,
      });
      assert.equal(passedOptions, options);
      return Promise.resolve({
        shopName: "Character Shop",
        itemInfos: [],
        pickedItems: [],
      });
    },
  };
  const api = new ParkPermanenceApi(
    authenticatedCaller(client as never, () => {
      authenticated = true;
      return Promise.resolve();
    }),
  );

  const result = await api.listCharacterShopItem(
    { parkPermanenceId: "park-001", actionNumber: 7 },
    options,
  );
  assert.equal(authenticated, true);
  assert.equal(called, true);
  assert.deepEqual(result, {
    shopName: "Character Shop",
    itemInfos: [],
    pickedItems: [],
  });
});
