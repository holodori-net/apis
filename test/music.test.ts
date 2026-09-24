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
  MUSIC_GET_HIGHEST_SCORE_LIVE_DECK,
  MUSIC_GET_HIGHEST_SCORE_RANKING_INFO,
  MUSIC_GET_HIGHEST_SCORE_RATING_RANKING_INFO,
  MUSIC_LIST_HIGHEST_SCORE_RATING_RANKING_RANK,
  MUSIC_LIST_HIGHEST_SCORE_RATING_RANKING_REWARD_THRESHOLD_RANKING_RANK_INFO,
} from "../src/services/music.js";

function signedVarintField(field: number, value: bigint | number): Buffer {
  return encodeVarintField(field, BigInt.asUintN(64, BigInt(value)));
}

void test("encodes Music read requests using contract field numbers", () => {
  assert.deepEqual(
    [
      ...decodeProtoFields(
        MUSIC_GET_HIGHEST_SCORE_LIVE_DECK.encode({
          publicUserId: "public-1",
          musicId: "music-1",
        }),
      ),
    ].map(([field, values]) => [field, values[0]]),
    [
      [1, Buffer.from("public-1")],
      [2, Buffer.from("music-1")],
    ],
  );
  assert.deepEqual(
    [
      ...decodeProtoFields(
        MUSIC_GET_HIGHEST_SCORE_RANKING_INFO.encode({
          musicId: "music-1",
        }),
      ),
    ],
    [[1, [Buffer.from("music-1")]]],
  );
  assert.deepEqual(
    [
      ...decodeProtoFields(
        MUSIC_LIST_HIGHEST_SCORE_RATING_RANKING_RANK.encode({
          characterIds: ["character-1", "character-2"],
        }),
      ),
    ],
    [[1, [Buffer.from("character-1"), Buffer.from("character-2")]]],
  );
  assert.throws(
    () =>
      MUSIC_LIST_HIGHEST_SCORE_RATING_RANKING_RANK.encode({
        characterIds: ["same", "same"],
      }),
    /unique/,
  );
  assert.deepEqual(
    [
      ...decodeProtoFields(
        MUSIC_GET_HIGHEST_SCORE_RATING_RANKING_INFO.encode({
          characterId: "character-1",
        }),
      ),
    ],
    [[1, [Buffer.from("character-1")]]],
  );
  assert.deepEqual(
    [
      ...decodeProtoFields(
        MUSIC_LIST_HIGHEST_SCORE_RATING_RANKING_REWARD_THRESHOLD_RANKING_RANK_INFO.encode(
          {
            characterId: "character-1",
          },
        ),
      ),
    ],
    [[1, [Buffer.from("character-1")]]],
  );
});

void test("declares Music ranking reads as authenticated cached calls", () => {
  for (const method of [
    MUSIC_GET_HIGHEST_SCORE_LIVE_DECK,
    MUSIC_GET_HIGHEST_SCORE_RANKING_INFO,
    MUSIC_LIST_HIGHEST_SCORE_RATING_RANKING_RANK,
    MUSIC_GET_HIGHEST_SCORE_RATING_RANKING_INFO,
    MUSIC_LIST_HIGHEST_SCORE_RATING_RANKING_REWARD_THRESHOLD_RANKING_RANK_INFO,
  ]) {
    assert.equal(method.requiresGameAuth, true);
    assert.equal(method.requiresMasterVersion, true);
    assert.equal(method.usesResponseCache, true);
    assert.equal(method.requiresRequestSignature, false);
  }
  assert.equal(
    MUSIC_GET_HIGHEST_SCORE_LIVE_DECK.path,
    "/rpc.api.Music/GetHighestScoreLiveDeck",
  );
});

void test("decodes Music ranking responses and shared ranking structures", () => {
  const publicProfile = encodeMessage(
    encodeStringField(1, "Player"),
    encodeVarintField(2, 42),
    encodeStringField(3, "Hello"),
    encodeStringField(4, "character-1"),
    encodeStringField(5, "fan-mark-1"),
    encodeStringField(6, "https://cdn/profile.png"),
    encodeBytesField(
      7,
      encodeMessage(encodeVarintField(1, 1), encodeStringField(2, "emblem-1")),
    ),
    encodeVarintField(8, 1_700_000_000_000n),
    encodeVarintField(9, 4),
    encodeStringField(10, "card-1"),
    encodeStringField(11, "Hidden"),
    encodeVarintField(100, 1),
    encodeVarintField(101, 1),
    encodeVarintField(102, 1),
    encodeVarintField(103, 1),
    encodeVarintField(104, 1),
    encodeVarintField(105, 1),
    encodeStringField(200, "sd-costume-1"),
    encodeStringField(201, "hair-1"),
  );
  const basicUser = encodeMessage(
    encodeStringField(1, "public-1"),
    encodeBytesField(2, publicProfile),
  );
  const basicRank = encodeMessage(
    encodeVarintField(1, 3),
    encodeVarintField(2, 9_223_372_036_854_775_000n),
    encodeBytesField(3, basicUser),
  );
  const deckCard = encodeMessage(
    encodeVarintField(1, 1),
    encodeStringField(2, "card-1"),
    encodeVarintField(3, 60),
    encodeVarintField(4, 5),
    encodeVarintField(5, 123_456n),
    encodeVarintField(6, 10_000n),
    encodeVarintField(7, 3_000n),
    encodeVarintField(8, 3_500n),
    encodeVarintField(9, 3_500n),
  );
  const deck = encodeMessage(
    encodeStringField(1, "character-1"),
    encodeStringField(2, "costume-1"),
    encodeBytesField(3, deckCard),
    encodeVarintField(4, 600_000n),
    encodeVarintField(5, 80_000n),
  );

  const liveDeck = MUSIC_GET_HIGHEST_SCORE_LIVE_DECK.decode(
    encodeBytesField(1, deck),
  );
  assert.equal(
    liveDeck.rankingLiveDeckInfo?.deckCards[0]?.senseForCardDetail,
    3_500n,
  );
  assert.equal(liveDeck.rankingLiveDeckInfo?.deckEvaluationValue, 80_000n);

  const scoreRanking = MUSIC_GET_HIGHEST_SCORE_RANKING_INFO.decode(
    encodeMessage(
      encodeVarintField(1, 12),
      encodeBytesField(2, basicRank),
      encodeBytesField(
        3,
        encodeMessage(
          encodeVarintField(1, 4),
          encodeVarintField(2, 987_654_321n),
        ),
      ),
    ),
  );
  assert.equal(scoreRanking.selfRank, 12);
  assert.equal(scoreRanking.rankInfos[0]?.score, 9_223_372_036_854_775_000n);
  assert.equal(
    scoreRanking.rankInfos[0]?.userInfo?.userProfileInfo?.isLiveResultPublish,
    true,
  );
  assert.equal(
    scoreRanking.selfMusicDifficultyScoreInfos[0]?.score,
    987_654_321n,
  );

  const deckResponseRank = MUSIC_GET_HIGHEST_SCORE_RATING_RANKING_INFO.decode(
    encodeBytesField(1, basicRank),
  );
  assert.equal(
    deckResponseRank.rankInfos[0]?.userInfo?.publicUserId,
    "public-1",
  );

  const characterRanks = MUSIC_LIST_HIGHEST_SCORE_RATING_RANKING_RANK.decode(
    encodeBytesField(
      1,
      encodeMessage(
        encodeVarintField(1, 20),
        encodeStringField(2, "character-1"),
      ),
    ),
  );
  assert.deepEqual(characterRanks.rankInfos, [
    {
      $typeName:
        "rpc.api.MusicListHighestScoreRatingRankingRankResponse.RankInfo",
      rank: 20,
      characterId: "character-1",
    },
  ]);

  const thresholds =
    MUSIC_LIST_HIGHEST_SCORE_RATING_RANKING_REWARD_THRESHOLD_RANKING_RANK_INFO.decode(
      encodeMessage(
        encodeBytesField(
          1,
          encodeMessage(
            encodeVarintField(1, 10),
            encodeVarintField(2, 100_000_000n),
          ),
        ),
        encodeVarintField(2, 1_700_000_000_000n),
      ),
    );
  assert.equal(thresholds.thresholdRankInfos[0]?.score, 100_000_000n);
  assert.equal(thresholds.updatedRankingTime, 1_700_000_000_000n);
});

void test("decodes signed Music and shared ranking int32/int64 fields", () => {
  const rankingInfo = MUSIC_GET_HIGHEST_SCORE_RANKING_INFO.decode(
    encodeMessage(
      signedVarintField(1, -3),
      encodeBytesField(
        3,
        encodeMessage(encodeVarintField(1, 4), signedVarintField(2, -100n)),
      ),
    ),
  );
  assert.equal(rankingInfo.selfRank, -3);
  assert.equal(rankingInfo.selfMusicDifficultyScoreInfos[0]?.score, -100n);

  const sharedRank = MUSIC_GET_HIGHEST_SCORE_RATING_RANKING_INFO.decode(
    encodeBytesField(
      1,
      encodeMessage(signedVarintField(1, -5), signedVarintField(2, -200n)),
    ),
  );
  assert.equal(sharedRank.rankInfos[0]?.rank, -5);
  assert.equal(sharedRank.rankInfos[0]?.score, -200n);

  const threshold =
    MUSIC_LIST_HIGHEST_SCORE_RATING_RANKING_REWARD_THRESHOLD_RANKING_RANK_INFO.decode(
      encodeMessage(
        encodeBytesField(
          1,
          encodeMessage(signedVarintField(1, -7), signedVarintField(2, -300n)),
        ),
        signedVarintField(2, -400n),
      ),
    );
  assert.equal(threshold.thresholdRankInfos[0]?.rank, -7);
  assert.equal(threshold.thresholdRankInfos[0]?.score, -300n);
  assert.equal(threshold.updatedRankingTime, -400n);

  const liveDeck = MUSIC_GET_HIGHEST_SCORE_LIVE_DECK.decode(
    encodeBytesField(
      1,
      encodeMessage(
        signedVarintField(4, -10n),
        signedVarintField(5, -11n),
        encodeBytesField(
          3,
          encodeMessage(
            signedVarintField(1, -1),
            signedVarintField(3, -2),
            signedVarintField(4, -3),
            signedVarintField(5, -12n),
          ),
        ),
      ),
    ),
  );
  assert.equal(liveDeck.rankingLiveDeckInfo?.deckPower, -10n);
  assert.equal(liveDeck.rankingLiveDeckInfo?.deckCards[0]?.position, -1);
  assert.equal(liveDeck.rankingLiveDeckInfo?.deckCards[0]?.level, -2);
  assert.equal(
    liveDeck.rankingLiveDeckInfo?.deckCards[0]?.potentialUpgradeCount,
    -3,
  );
  assert.equal(liveDeck.rankingLiveDeckInfo?.deckCards[0]?.liveDeckPower, -12n);
});
