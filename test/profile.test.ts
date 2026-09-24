import assert from "node:assert/strict";
import { test } from "vitest";

import {
  decodeProtoFields,
  encodeBytesField,
  encodeMessage,
  encodeStringField,
  encodeVarintField,
} from "../src/low-level.js";
import { PROFILE_GET_USER_PROFILE_DETAIL } from "../src/services/profile.js";

function signedVarintField(field: number, value: bigint | number): Buffer {
  return encodeVarintField(field, BigInt.asUintN(64, BigInt(value)));
}

void test("encodes Profile/GetUserProfileDetail requests", () => {
  assert.deepEqual(
    [
      ...decodeProtoFields(
        PROFILE_GET_USER_PROFILE_DETAIL.encode({
          publicUserId: "public-1",
        }),
      ),
    ],
    [[1, [Buffer.from("public-1")]]],
  );
  assert.throws(
    () => PROFILE_GET_USER_PROFILE_DETAIL.encode({ publicUserId: "" }),
    /public user ID/,
  );
});

void test("declares Profile/GetUserProfileDetail policies from its contract", () => {
  assert.equal(
    PROFILE_GET_USER_PROFILE_DETAIL.path,
    "/rpc.api.Profile/GetUserProfileDetail",
  );
  assert.equal(PROFILE_GET_USER_PROFILE_DETAIL.requiresGameAuth, true);
  assert.equal(PROFILE_GET_USER_PROFILE_DETAIL.requiresMasterVersion, false);
  assert.equal(PROFILE_GET_USER_PROFILE_DETAIL.usesResponseCache, true);
  assert.equal(PROFILE_GET_USER_PROFILE_DETAIL.requiresRequestSignature, false);
});

void test("decodes visible public profile details and gameplay summaries", () => {
  const userProfileInfo = encodeMessage(
    encodeStringField(1, "Player"),
    signedVarintField(2, -99),
    encodeStringField(3, "Profile message"),
    encodeStringField(4, "character-1"),
    encodeStringField(5, "fan-mark-1"),
    encodeStringField(6, "https://cdn/profile.png"),
    encodeBytesField(
      7,
      encodeMessage(encodeVarintField(1, 1), encodeStringField(2, "emblem-1")),
    ),
    encodeVarintField(8, 1_700_000_000_001n),
    encodeVarintField(9, 5),
    encodeStringField(10, "card-1"),
    encodeStringField(11, "MultiGame"),
    encodeVarintField(100, 1),
    encodeVarintField(101, 1),
    encodeVarintField(102, 1),
    encodeVarintField(103, 1),
    encodeVarintField(104, 1),
    encodeVarintField(105, 1),
    encodeStringField(200, "sd-costume-1"),
    encodeStringField(201, "hair-1"),
  );
  const highestDeck = encodeMessage(
    encodeStringField(1, "character-1"),
    encodeStringField(2, "costume-1"),
    encodeBytesField(
      3,
      encodeMessage(
        encodeVarintField(1, 1),
        encodeStringField(2, "card-1"),
        encodeVarintField(3, 60),
        encodeVarintField(4, 5),
      ),
    ),
    encodeVarintField(4, 100_000n),
    encodeVarintField(5, 4),
    encodeVarintField(6, 2),
  );
  const detail = encodeMessage(
    encodeStringField(1, "public-1"),
    encodeBytesField(2, userProfileInfo),
    signedVarintField(3, -123),
    encodeBytesField(4, highestDeck),
    encodeBytesField(
      5,
      encodeMessage(
        encodeStringField(1, "character-1"),
        encodeVarintField(2, 50),
      ),
    ),
    signedVarintField(6, -12_345_678_901n),
    encodeBytesField(
      7,
      encodeMessage(encodeVarintField(1, 4), encodeVarintField(2, 10)),
    ),
    encodeBytesField(
      8,
      encodeMessage(encodeVarintField(1, 4), encodeVarintField(2, 8)),
    ),
    encodeBytesField(
      9,
      encodeMessage(encodeVarintField(1, 4), encodeVarintField(2, 6)),
    ),
    encodeBytesField(
      10,
      encodeMessage(encodeVarintField(1, 2), encodeVarintField(2, 1_234_567n)),
    ),
    encodeVarintField(11, 1),
    encodeVarintField(12, 3),
    encodeBytesField(
      13,
      encodeMessage(
        encodeStringField(1, "character-1"),
        encodeVarintField(2, 900_000n),
      ),
    ),
    encodeVarintField(14, 75),
    signedVarintField(15, -9_000_000_000n),
  );

  const response = PROFILE_GET_USER_PROFILE_DETAIL.decode(
    encodeBytesField(1, detail),
  );
  const decoded = response.userProfileDetailInfo;
  assert.equal(decoded?.publicUserId, "public-1");
  assert.equal(decoded?.userProfileInfo?.name, "Player");
  assert.equal(decoded?.userProfileInfo?.level, -99);
  assert.equal(
    decoded?.userProfileInfo?.emblemPositions[0]?.emblemId,
    "emblem-1",
  );
  assert.equal(decoded?.userProfileInfo?.isCharacterRankPublish, true);
  assert.equal(decoded?.userProfileInfo?.sdCostumeHairAccessoryId, "hair-1");
  assert.equal(decoded?.achievementClearCount, -123);
  assert.equal(
    decoded?.highestLiveDeckEvaluationLiveDeck?.liveDeckPositions[0]
      ?.potentialUpgradeCount,
    5,
  );
  assert.equal(
    decoded?.highestLiveDeckEvaluationLiveDeck?.liveDeckEvaluationValue,
    100_000n,
  );
  assert.equal(decoded?.characterLevels[0]?.level, 50);
  assert.equal(decoded?.totalMusicHighestScoreRatingValue, -12_345_678_901n);
  assert.equal(decoded?.liveClearResults[0]?.count, 10);
  assert.equal(decoded?.liveFullComboResults[0]?.count, 8);
  assert.equal(decoded?.liveAllPerfectResults[0]?.count, 6);
  assert.equal(decoded?.miniGameResults[0]?.value, 1_234_567n);
  assert.equal(decoded?.isBlockedUser, true);
  assert.equal(decoded?.friendStatusType, 3);
  assert.equal(decoded?.topMusicHighestScoreRatingInfos[0]?.value, 900_000n);
  assert.equal(decoded?.comboCardGameAverageRankPercent, 75);
  assert.equal(decoded?.comboCardGameChipDiffTotalQuantity, -9_000_000_000n);
});
