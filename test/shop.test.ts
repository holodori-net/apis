import assert from "node:assert/strict";
import { test } from "vitest";

import {
  decodeShopListResponse,
  encodeShopListRequest,
} from "../src/codecs/shop.js";
import {
  encodeBytesField,
  encodeMessage,
  encodeStringField,
  encodeVarint,
  encodeVarintField,
} from "../src/low-level.js";
import { SHOP_LIST, ShopApi } from "../src/services/shop.js";

const shop = encodeMessage(
  encodeStringField(1, "shop-main"),
  encodeBytesField(
    2,
    encodeMessage(
      encodeVarintField(1, 1),
      encodeBytesField(
        2,
        encodeMessage(
          encodeStringField(1, "item-stamina"),
          encodeStringField(2, "Stamina"),
          encodeBytesField(
            3,
            encodeMessage(
              encodeBytesField(
                1,
                encodeMessage(
                  encodeVarintField(1, 3),
                  encodeStringField(2, "ticket-1"),
                  encodeVarintField(3, 5_000_000_000n),
                ),
              ),
              encodeVarintField(2, 250),
              encodeVarintField(3, 37n),
            ),
          ),
          encodeBytesField(
            4,
            encodeMessage(
              encodeVarintField(1, 2),
              encodeStringField(2, "card-1"),
              encodeVarintField(3, 3n),
            ),
          ),
          encodeVarintField(5, 1),
          encodeVarintField(10, 2),
          encodeVarintField(11, 1),
          encodeVarintField(16, 1),
        ),
      ),
    ),
  ),
  encodeVarintField(3, 4),
  encodeStringField(4, "Membership"),
  encodeVarintField(5, 9_000_000_000n),
  encodeVarintField(6, 1),
  encodeVarintField(7, 8_000_000_000n),
  encodeStringField(8, "asset-shop"),
  encodeStringField(9, "Welcome"),
  encodeStringField(10, "Description"),
  encodeVarintField(11, 1002),
  encodeBytesField(11, encodeVarint(1001)),
  encodeStringField(12, "stone-paid"),
);

void test("encodes an empty Shop/List request", () => {
  assert.equal(encodeShopListRequest().length, 0);
});

void test("decodes shop catalogue fields and int64 values", () => {
  assert.deepEqual(decodeShopListResponse(encodeBytesField(1, shop)), {
    shops: [
      {
        id: "shop-main",
        items: [
          {
            type: 1,
            consumptionItem: {
              id: "item-stamina",
              name: "Stamina",
              consumption: {
                resourceType: 3,
                resourceId: "ticket-1",
                quantity: 5_000_000_000n,
              },
              discountPermilDown: 250,
              discountedQuantity: 37n,
              rewards: [
                { resourceType: 2, resourceId: "card-1", quantity: 3n },
              ],
              isUnlocked: true,
              unlockConditionGroupId: "",
              endTime: 0n,
              resetIntervalType: 0,
              nextResetTime: 0n,
              limitCount: 2,
              purchasedCount: 1,
              assetId: "",
              lastResetTime: 0n,
              isBackgroundSpecial: false,
              color: "",
              isNew: true,
              isEnableMultiplePurchase: false,
            },
          },
        ],
        type: 4,
        name: "Membership",
        endTime: 9_000_000_000n,
        resetIntervalType: 1,
        nextResetTime: 8_000_000_000n,
        thumbnailAssetId: "asset-shop",
        descriptionTitle: "Welcome",
        descriptionText: "Description",
        displayPossessionResourceTypes: [1002, 1001],
        displayPossessionResourceIds: ["stone-paid"],
      },
    ],
  });
});

void test("decodes charge item products, rewards, and account purchase state", () => {
  const response = encodeMessage(
    encodeBytesField(
      1,
      encodeMessage(
        encodeStringField(1, "shop-stone"),
        encodeBytesField(
          2,
          encodeMessage(
            encodeVarintField(1, 2),
            encodeBytesField(
              3,
              encodeMessage(
                encodeStringField(1, "stone-pack"),
                encodeVarintField(2, 1),
                encodeBytesField(
                  3,
                  encodeMessage(
                    encodeStringField(1, "Stone pack"),
                    encodeVarintField(4, 500),
                    encodeBytesField(
                      5,
                      encodeMessage(
                        encodeVarintField(1, 1001),
                        encodeStringField(2, "stone"),
                        encodeVarintField(3, 2500n),
                      ),
                    ),
                    encodeVarintField(6, 1),
                    encodeVarintField(13, 5),
                    encodeVarintField(14, 2),
                    encodeStringField(100, "apple.product"),
                    encodeStringField(101, "google.product"),
                    encodeStringField(102, "steam.product"),
                    encodeStringField(200, "12.34"),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );

  const item = decodeShopListResponse(response).shops[0]?.items[0]?.chargeItem;
  assert.deepEqual(item, {
    id: "stone-pack",
    type: 1,
    consumable: {
      name: "Stone pack",
      providePaidStoneQuantity: 500,
      rewards: [{ resourceType: 1001, resourceId: "stone", quantity: 2500n }],
      isUnlocked: true,
      unlockConditionGroupId: "",
      endTime: 0n,
      resetIntervalType: 0,
      nextResetTime: 0n,
      limitCount: 5,
      purchasedCount: 2,
      assetId: "",
      lastResetTime: 0n,
      isBackgroundSpecial: false,
      color: "",
      isNew: false,
      appleIapProductId: "apple.product",
      googleIapProductId: "google.product",
      steamMtxProductId: "steam.product",
      steamPrice: "12.34",
    },
  });
});

void test("Shop/List authenticates lazily and declares read policies", async () => {
  const paths: string[] = [];
  const client = {
    call: (method: { path: string }) => {
      paths.push(method.path);
      return Promise.resolve({ shops: [] });
    },
  };
  let authCalls = 0;
  const authenticate = () => {
    authCalls += 1;
    return Promise.resolve();
  };
  await new ShopApi(client as never, authenticate).list();
  assert.equal(authCalls, 1);
  assert.deepEqual(paths, ["/rpc.api.Shop/List"]);

  assert.equal(SHOP_LIST.requiresGameAuth, true);
  assert.equal(SHOP_LIST.requiresMasterVersion, true);
  assert.equal(SHOP_LIST.usesResponseCache, true);
  assert.equal(SHOP_LIST.requiresRequestSignature, false);
});
