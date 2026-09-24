import assert from "node:assert/strict";
import { test } from "vitest";

import {
  encodeBytesField,
  encodeMessage,
  encodeStringField,
} from "../src/low-level.js";
import {
  ASSET_LIST_EXPIRED_ASSET_ID,
  AssetApi,
} from "../src/services/asset.js";
import { authenticatedCaller } from "./support/authenticated-caller.js";
import { withoutTypeNames } from "./support/without-type-names.js";

void test("decodes feature-specific expired asset IDs", () => {
  const response = encodeMessage(
    encodeBytesField(
      1,
      encodeMessage(
        encodeStringField(1, "home-old"),
        encodeStringField(1, "home-unused"),
      ),
    ),
    encodeBytesField(2, encodeMessage(encodeStringField(1, "park-old"))),
    encodeBytesField(
      3,
      encodeMessage(
        encodeStringField(1, "event-logo-old"),
        encodeStringField(2, "event-bg-old"),
      ),
    ),
    encodeBytesField(
      4,
      encodeMessage(
        encodeStringField(1, "marathon-logo-old"),
        encodeStringField(2, "marathon-bg-old"),
      ),
    ),
    encodeBytesField(
      5,
      encodeMessage(
        encodeStringField(1, "bonus-logo-old"),
        encodeStringField(2, "bonus-bg-old"),
        encodeStringField(3, "bonus-thumb-old"),
      ),
    ),
    encodeBytesField(
      6,
      encodeMessage(encodeStringField(1, "shop-thumbnail-old")),
    ),
    encodeBytesField(7, encodeMessage(encodeStringField(1, "startup-old"))),
    encodeBytesField(
      8,
      encodeMessage(
        encodeStringField(1, "gacha-icon-old"),
        encodeStringField(2, "gacha-image-old"),
        encodeStringField(3, "gacha-movie-old"),
        encodeStringField(4, "gacha-bgm-old"),
        encodeStringField(5, "gacha-animation-old"),
      ),
    ),
  );

  assert.deepEqual(
    withoutTypeNames(ASSET_LIST_EXPIRED_ASSET_ID.decode(response)),
    {
      homeBanner: { assetIds: ["home-old", "home-unused"] },
      parkBanner: { assetIds: ["park-old"] },
      event: {
        logoAssetIds: ["event-logo-old"],
        backgroundAssetIds: ["event-bg-old"],
      },
      marathon: {
        logoAssetIds: ["marathon-logo-old"],
        backgroundAssetIds: ["marathon-bg-old"],
      },
      loginBonus: {
        logoAssetIds: ["bonus-logo-old"],
        backgroundAssetIds: ["bonus-bg-old"],
        thumbnailAssetIds: ["bonus-thumb-old"],
      },
      shop: { thumbnailAssetIds: ["shop-thumbnail-old"] },
      startupNotification: { assetIds: ["startup-old"] },
      gacha: {
        iconAssetIds: ["gacha-icon-old"],
        promotionImageAssetIds: ["gacha-image-old"],
        promotionMovieAssetIds: ["gacha-movie-old"],
        bgmAssetIds: ["gacha-bgm-old"],
        gachaAnimationAssetIds: ["gacha-animation-old"],
      },
    },
  );
});

void test("AssetApi authenticates and uses the contract policies", async () => {
  let ensured = false;
  const api = new AssetApi(
    authenticatedCaller(
      {
        call: (
          method: { path: string; encode: (request: unknown) => Buffer },
          request: unknown,
        ) => {
          assert.equal(method.path, "/rpc.api.Asset/ListExpiredAssetId");
          assert.equal(request, undefined);
          assert.deepEqual(method.encode(request), Buffer.alloc(0));
          return Promise.resolve({});
        },
      } as never,
      () => {
        ensured = true;
        return Promise.resolve();
      },
    ),
  );

  await api.listExpiredAssetId();
  assert.equal(ensured, true);
  assert.equal(ASSET_LIST_EXPIRED_ASSET_ID.requiresGameAuth, true);
  assert.equal(ASSET_LIST_EXPIRED_ASSET_ID.requiresMasterVersion, true);
  assert.equal(ASSET_LIST_EXPIRED_ASSET_ID.usesResponseCache, true);
  assert.equal(ASSET_LIST_EXPIRED_ASSET_ID.requiresRequestSignature, false);
});
