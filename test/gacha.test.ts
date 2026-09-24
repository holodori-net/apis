import assert from "node:assert/strict";
import { test } from "vitest";

import {
  decodeProtoFields,
  encodeBytesField,
  encodeMessage,
  encodeStringField,
  encodeVarintField,
} from "../src/low-level.js";
import {
  GACHA_LIST,
  GACHA_LIST_CARD_SELECT_PROBABILITY,
  GACHA_LIST_NORMAL_PROBABILITY,
  GachaApi,
} from "../src/services/gacha.js";
import { authenticatedCaller } from "./support/authenticated-caller.js";
import { withoutTypeNames } from "./support/without-type-names.js";

void test("encodes probability requests with a required Gacha ID", () => {
  assert.equal(
    decodeProtoFields(
      GACHA_LIST_NORMAL_PROBABILITY.encode({ gachaId: "gacha-1" }),
    )
      .get(1)?.[0]
      ?.toString(),
    "gacha-1",
  );
  assert.throws(
    () => GACHA_LIST_NORMAL_PROBABILITY.encode({ gachaId: "" }),
    /Gacha ID/,
  );
});

void test("decodes Gacha list content and account-specific draw state", () => {
  const button = encodeMessage(
    encodeStringField(1, "button-1"),
    encodeStringField(2, "Ten draw"),
    encodeStringField(3, "Once per day"),
    encodeVarintField(4, 1),
    encodeBytesField(
      5,
      encodeMessage(
        encodeVarintField(1, 2),
        encodeStringField(2, "paid-gem"),
        encodeVarintField(3, 300n),
      ),
    ),
    encodeBytesField(
      6,
      encodeMessage(
        encodeVarintField(1, 3),
        encodeStringField(2, "ticket"),
        encodeVarintField(3, 1n),
      ),
    ),
    encodeVarintField(7, 1),
    encodeVarintField(8, 2),
    encodeVarintField(9, 10),
    encodeVarintField(10, 1),
    encodeVarintField(11, 1),
    encodeVarintField(12, 4),
  );
  const gacha = encodeMessage(
    encodeStringField(1, "gacha-1"),
    encodeVarintField(2, 3),
    encodeStringField(3, "Featured Gacha"),
    encodeVarintField(4, 1),
    encodeStringField(5, "condition-group"),
    encodeVarintField(6, 1_750_000_000_000n),
    encodeVarintField(7, 1_750_100_000_000n),
    encodeStringField(8, "notice-1"),
    encodeStringField(9, "Terms"),
    encodeStringField(10, "gacha-icon"),
    encodeStringField(11, "card-a"),
    encodeStringField(12, "card-b"),
    encodeStringField(13, "movie"),
    encodeStringField(14, "banner"),
    encodeVarintField(15, 1),
    encodeBytesField(16, button),
    encodeBytesField(
      17,
      encodeMessage(encodeStringField(1, "point-1"), encodeVarintField(2, 30)),
    ),
    encodeBytesField(
      18,
      encodeMessage(
        encodeStringField(1, "card-a"),
        encodeBytesField(
          2,
          encodeMessage(
            encodeVarintField(1, 1),
            encodeStringField(2, "coin"),
            encodeVarintField(3, 5n),
          ),
        ),
      ),
    ),
    encodeBytesField(
      19,
      encodeMessage(
        encodeStringField(1, "card-c"),
        encodeVarintField(2, 1),
        encodeStringField(3, "card-c"),
      ),
    ),
    encodeVarintField(20, 1),
    encodeStringField(21, "animation-group"),
    encodeStringField(22, "movie-group"),
    encodeStringField(23, "animation"),
    encodeVarintField(24, 1_750_000_100_000n),
    encodeStringField(25, "bgm"),
    encodeVarintField(26, 1),
    encodeStringField(27, "slot"),
    encodeStringField(28, "Promotion"),
    encodeStringField(29, "Subtext"),
    encodeVarintField(30, 24),
  );
  const decoded = GACHA_LIST.decode(
    encodeMessage(
      encodeBytesField(
        1,
        encodeMessage(
          encodeStringField(1, "group-1"),
          encodeStringField(2, "group-icon"),
          encodeBytesField(3, gacha),
        ),
      ),
    ),
  );

  assert.deepEqual(withoutTypeNames(decoded.gachaGroups[0]), {
    gachaGroupId: "group-1",
    iconAssetId: "group-icon",
    gachas: [
      {
        gachaId: "gacha-1",
        type: 3,
        name: "Featured Gacha",
        isLocked: true,
        unlockConditionGroupId: "condition-group",
        startTime: 1_750_000_000_000n,
        endTime: 1_750_100_000_000n,
        detailNoticeId: "notice-1",
        precaution: "Terms",
        iconAssetId: "gacha-icon",
        pickupCardIds: ["card-a"],
        promotionPickupCardIds: ["card-b"],
        promotionMovieAssetId: "movie",
        promotionImageAssetId: "banner",
        isDisplayPromotionPickupCardRandom: true,
        gachaButtons: [
          {
            gachaButtonId: "button-1",
            name: "Ten draw",
            description: "Once per day",
            isDisabled: true,
            consumptions: [
              { resourceType: 2, resourceId: "paid-gem", quantity: 300n },
            ],
            bonusRewards: [
              { resourceType: 3, resourceId: "ticket", quantity: 1n },
            ],
            limitCount: 1,
            resetIntervalType: 2,
            totalRewardPickCount: 10,
            fixedRewardPickCount: 1,
            drawnCount: 1,
            priority: 4,
          },
        ],
        gachaPoint: { gachaPointId: "point-1", quantity: 30 },
        cardBonuses: [
          {
            cardId: "card-a",
            rewards: [{ resourceType: 1, resourceId: "coin", quantity: 5n }],
          },
        ],
        cardSelect: {
          selectableCardIds: ["card-c"],
          selectableCardQuantity: 1,
          selectedCardIds: ["card-c"],
        },
        isEndTimeHidden: true,
        gachaAnimationGroupingId: "animation-group",
        gachaAnimationMovieGroupId: "movie-group",
        gachaAnimationAssetId: "animation",
        readTime: 1_750_000_100_000n,
        bgmAssetId: "bgm",
        isPromotionPickupCardMovie: true,
        fixedSlotName: "slot",
        promotionText: "Promotion",
        promotionSubText: "Subtext",
        termLimitedHours: 24,
      },
    ],
  });
});

void test("decodes probability values as exact integer parts per ten million", () => {
  const cardProbability = encodeMessage(
    encodeStringField(1, "card-1"),
    encodeVarintField(2, 12_345),
    encodeVarintField(3, 1),
  );
  const rarityProbability = encodeMessage(
    encodeVarintField(1, 5),
    encodeVarintField(2, 123_456),
    encodeBytesField(3, cardProbability),
  );
  assert.deepEqual(
    withoutTypeNames(
      GACHA_LIST_NORMAL_PROBABILITY.decode(
        encodeMessage(
          encodeBytesField(1, rarityProbability),
          encodeBytesField(2, rarityProbability),
        ),
      ),
    ),
    {
      normalRarityProbabilities: [
        {
          rarity: 5,
          partsPerTenMillionProbability: 123_456,
          cardProbabilities: [
            {
              cardId: "card-1",
              partsPerTenMillionProbability: 12_345,
              isRateUp: true,
            },
          ],
        },
      ],
      fixedRarityProbabilities: [
        {
          rarity: 5,
          partsPerTenMillionProbability: 123_456,
          cardProbabilities: [
            {
              cardId: "card-1",
              partsPerTenMillionProbability: 12_345,
              isRateUp: true,
            },
          ],
        },
      ],
    },
  );
});

void test("Gacha API authenticates read methods and declares transport policies", async () => {
  const calls: string[] = [];
  const client = {
    call: (method: { path: string }, request: unknown) => {
      calls.push(`${method.path}:${JSON.stringify(request)}`);
      return Promise.resolve(
        method.path.endsWith("/List")
          ? { gachaGroups: [] }
          : { normalRarityProbabilities: [], fixedRarityProbabilities: [] },
      );
    },
  };
  let authenticationCalls = 0;
  const api = new GachaApi(
    authenticatedCaller(client as never, () => {
      authenticationCalls += 1;
      return Promise.resolve();
    }),
  );

  await api.list();
  await api.listNormalProbability("gacha-1");
  await api.listCardSelectProbability("gacha-2");

  assert.equal(authenticationCalls, 3);
  assert.deepEqual(calls, [
    "/rpc.api.Gacha/List:undefined",
    '/rpc.api.Gacha/ListNormalProbability:{"gachaId":"gacha-1"}',
    '/rpc.api.Gacha/ListCardSelectProbability:{"gachaId":"gacha-2"}',
  ]);
  for (const method of [
    GACHA_LIST,
    GACHA_LIST_NORMAL_PROBABILITY,
    GACHA_LIST_CARD_SELECT_PROBABILITY,
  ]) {
    assert.equal(method.requiresGameAuth, true);
    assert.equal(method.requiresMasterVersion, true);
    assert.equal(method.usesResponseCache, true);
    assert.equal(method.requiresRequestSignature, false);
  }
});
