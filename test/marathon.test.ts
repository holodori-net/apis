import assert from "node:assert/strict";
import { test } from "vitest";

import {
  decodeMarathonMusicRankingResponse,
  decodeMarathonScoreRankingResponse,
  decodeMarathonTopResponse,
  encodeMarathonListMusicHighestScoreRankingRequest,
  encodeMarathonListRankingRequest,
  encodeMarathonTopRequest,
} from "../src/codecs/marathon.js";
import {
  encodeBytesField,
  encodeMessage,
  encodeStringField,
  encodeVarintField,
} from "../src/low-level.js";
import {
  MARATHON_LIST_MUSIC_HIGHEST_SCORE_RANKING_GRADE,
  MARATHON_LIST_MUSIC_HIGHEST_SCORE_RANKING_TOP,
  MARATHON_LIST_SCORE_RANKING_GRADE,
  MARATHON_LIST_SCORE_RANKING_TOP,
  MARATHON_LIST_TOTAL_MUSIC_HIGHEST_SCORE_RANKING_GRADE,
  MARATHON_LIST_TOTAL_MUSIC_HIGHEST_SCORE_RANKING_TOP,
  MARATHON_TOP,
} from "../src/services/marathon.js";

void test("encodes Marathon requests with their contract field numbers", () => {
  assert.deepEqual(
    encodeMarathonTopRequest({ marathonId: "marathon-1" }),
    encodeMessage(encodeStringField(1, "marathon-1")),
  );
  assert.deepEqual(
    encodeMarathonListMusicHighestScoreRankingRequest({
      marathonChapterId: "chapter-1",
      musicId: "music-1",
    }),
    encodeMessage(
      encodeStringField(1, "chapter-1"),
      encodeStringField(2, "music-1"),
    ),
  );
  assert.deepEqual(
    encodeMarathonListRankingRequest({ marathonChapterId: "chapter-1" }),
    encodeMessage(encodeStringField(1, "chapter-1")),
  );
  assert.throws(
    () => encodeMarathonTopRequest({ marathonId: "" }),
    /Marathon ID/,
  );
});

void test("decodes full Marathon top metadata and personal ranking state", () => {
  const reward = encodeMessage(
    encodeVarintField(1, 2),
    encodeStringField(2, "item-1"),
    encodeVarintField(3, 15n),
  );
  const scoreReward = encodeMessage(
    encodeVarintField(1, 10_000n),
    encodeBytesField(2, reward),
  );
  const chapter = encodeMessage(
    encodeStringField(1, "chapter-1"),
    encodeVarintField(2, 2),
    encodeStringField(3, "character-1"),
    encodeVarintField(4, 1_700_000_000_000n),
    encodeStringField(5, "Event score"),
    encodeStringField(6, "score-icon"),
    encodeStringField(7, "badge-item"),
    encodeStringField(8, "score-rank-group"),
    encodeStringField(9, "music-rank-group"),
    encodeStringField(10, "total-rank-group"),
    encodeStringField(11, "music-bonus-group"),
    encodeStringField(12, "mini-bonus-group"),
    encodeStringField(13, "live-bonus-group"),
    encodeStringField(14, "mini-rate-group"),
    encodeStringField(15, "missions"),
    encodeBytesField(16, scoreReward),
    encodeVarintField(17, 99_999n),
    encodeStringField(18, "story-chapter"),
    encodeStringField(19, "story"),
    encodeStringField(20, "background"),
    encodeStringField(21, "bgm"),
    encodeVarintField(22, 1_700_100_000_000n),
  );
  const musicScoreBonus = encodeMessage(
    encodeStringField(1, "music-bonus-group"),
    encodeStringField(2, "music-1"),
    encodeVarintField(3, 1),
    encodeStringField(4, "character-1"),
    encodeStringField(5, "card-1"),
    encodeVarintField(6, 3),
    encodeVarintField(7, 4),
    encodeVarintField(8, 5n),
    encodeVarintField(9, 150),
  );
  const rankReward = encodeMessage(
    encodeStringField(1, "rank-reward-group"),
    encodeVarintField(2, 100n),
    encodeBytesField(3, reward),
    encodeStringField(4, "grade-1"),
  );
  const marathon = encodeMessage(
    encodeStringField(1, "marathon-1"),
    encodeVarintField(2, 1_700_000_000_000n),
    encodeVarintField(3, 1_700_100_000_000n),
    encodeVarintField(4, 1_700_200_000_000n),
    encodeStringField(5, "Marathon name"),
    encodeStringField(6, "logo"),
    encodeStringField(7, "condition-group"),
    encodeStringField(8, "exchange-group"),
    encodeStringField(9, "mission-group"),
    encodeVarintField(10, 1_700_000_000_000n),
    encodeVarintField(11, 1_700_300_000_000n),
    encodeBytesField(12, chapter),
    encodeBytesField(
      13,
      encodeMessage(
        encodeStringField(1, "mini-bonus-group"),
        encodeVarintField(2, 1),
        encodeStringField(3, "card-mini"),
        encodeVarintField(4, 2),
        encodeVarintField(5, 3n),
        encodeVarintField(6, 250),
      ),
    ),
    encodeBytesField(
      14,
      encodeMessage(
        encodeStringField(1, "live-bonus-group"),
        encodeVarintField(2, 2),
        encodeStringField(3, "character-1"),
        encodeStringField(4, "card-live"),
        encodeVarintField(5, 1),
        encodeVarintField(6, 3),
        encodeVarintField(7, 4n),
        encodeVarintField(8, 300),
      ),
    ),
    encodeBytesField(15, musicScoreBonus),
    encodeBytesField(
      16,
      encodeMessage(
        encodeStringField(1, "mini-rate-group"),
        encodeVarintField(2, 5),
        encodeVarintField(3, 1_500),
        encodeVarintField(4, 100),
      ),
    ),
    encodeBytesField(17, rankReward),
    encodeBytesField(
      18,
      encodeMessage(
        encodeStringField(1, "music-rank-group"),
        encodeStringField(2, "music-1"),
        encodeVarintField(3, 10n),
        encodeBytesField(4, reward),
        encodeStringField(5, "grade-2"),
      ),
    ),
    encodeBytesField(19, rankReward),
    encodeVarintField(20, 1),
    encodeVarintField(21, 3),
  );
  const personalChapter = encodeMessage(
    encodeStringField(1, "chapter-1"),
    encodeVarintField(2, 2n),
    encodeBytesField(3, reward),
    encodeBytesField(
      4,
      encodeMessage(
        encodeStringField(1, "music-1"),
        encodeVarintField(2, 3n),
        encodeBytesField(3, reward),
      ),
    ),
    encodeVarintField(5, 4n),
    encodeBytesField(6, reward),
  );
  const response = decodeMarathonTopResponse(
    encodeMessage(
      encodeBytesField(1, marathon),
      encodeBytesField(2, encodeMessage(encodeBytesField(1, personalChapter))),
    ),
  );

  assert.equal(response.marathon?.id, "marathon-1");
  assert.equal(response.marathon?.startTime, 1_700_000_000_000n);
  assert.equal(response.marathon?.exchangeBoothGroupId, "exchange-group");
  assert.equal(
    response.marathon?.aggregatedRankingRevealStartTime,
    1_700_300_000_000n,
  );
  assert.equal(response.marathon?.marathonChapters[0]?.score, 99_999n);
  assert.equal(
    response.marathon?.marathonChapters[0]?.scoreRewards[0]?.score,
    10_000n,
  );
  assert.equal(response.marathon?.musicScoreBonuses[0]?.scoreUpPermilUp, 150);
  assert.equal(
    response.marathon?.miniGameScoreBonuses[0]?.cardPotentialUpgradeCount,
    3n,
  );
  assert.equal(
    response.marathon?.liveScoreBonuses[0]?.marathonScoreQuantityUpPermilUp,
    300,
  );
  assert.equal(response.marathon?.miniGameScoreRates[0]?.bonusPermilUp, 100);
  assert.equal(response.marathon?.scoreRankingRankRewards[0]?.endRank, 100n);
  assert.equal(
    response.marathon?.musicHighestScoreRankingRankRewards[0]?.musicId,
    "music-1",
  );
  assert.equal(
    response.marathon?.totalMusicHighestScoreRankingRewards[0]?.groupId,
    "rank-reward-group",
  );
  assert.equal(response.marathon?.isMarathonScoreRankingDisable, true);
  assert.equal(response.marathon?.tipsHintType, 3);
  assert.equal(
    response.marathon?.marathonChapters[0]?.rankingRevealStartTime,
    1_700_100_000_000n,
  );
  assert.equal(
    response.marathon?.marathonChapters[0]?.marathonEventBadgeItemId,
    "badge-item",
  );
  assert.equal(
    response.marathon?.marathonChapters[0]?.missionGroupId,
    "missions",
  );
  assert.equal(
    response.marathon?.marathonChapters[0]
      ?.musicHighestScoreRankingRankRewardGroupId,
    "music-rank-group",
  );
  assert.equal(
    response.rankingResult?.marathonChapters[0]?.marathonScoreRank,
    2n,
  );
  assert.equal(
    response.rankingResult?.marathonChapters[0]
      ?.musicHighestScoreRankingRankResults[0]?.rank,
    3n,
  );
  assert.equal(
    response.rankingResult?.marathonChapters[0]?.marathonScoreRankingRewards[0]
      ?.quantity,
    15n,
  );
  assert.equal(
    response.rankingResult?.marathonChapters[0]
      ?.totalMusicHighestScoreRankingRewards[0]?.quantity,
    15n,
  );
});

void test("decodes all ranking response shapes with full shared rank entries", () => {
  const profile = encodeMessage(
    encodeStringField(1, "top player"),
    encodeVarintField(2, 20),
    encodeStringField(3, "message"),
    encodeStringField(4, "park-character"),
    encodeStringField(5, "fan-mark"),
    encodeStringField(6, "palette-url"),
    encodeBytesField(
      7,
      encodeMessage(encodeVarintField(1, 5), encodeStringField(2, "emblem-id")),
    ),
    encodeVarintField(8, 1_700_000_000_000n),
    encodeVarintField(9, 2),
    encodeStringField(10, "background-card"),
    encodeStringField(11, "private-name"),
    encodeVarintField(100, 1),
    encodeVarintField(101, 1),
    encodeVarintField(102, 0),
    encodeVarintField(103, 1),
    encodeVarintField(104, 0),
    encodeVarintField(105, 1),
    encodeStringField(200, "sd-costume"),
    encodeStringField(201, "sd-hair"),
  );
  const userInfo = encodeMessage(
    encodeStringField(1, "public-id"),
    encodeBytesField(2, profile),
  );
  const rankInfo = encodeMessage(
    encodeVarintField(1, 12),
    encodeVarintField(2, 9_007_199_254_740_993n),
    encodeBytesField(3, userInfo),
  );
  const ranking = encodeMessage(
    encodeVarintField(1, BigInt.asUintN(64, -1n)),
    encodeVarintField(2, BigInt.asUintN(64, -9_007_199_254_740_997n)),
    encodeVarintField(3, 1),
    encodeBytesField(4, rankInfo),
  );
  const musicResponse = decodeMarathonMusicRankingResponse(
    encodeBytesField(1, ranking),
  );
  const scoreResponse = decodeMarathonScoreRankingResponse(
    encodeBytesField(1, ranking),
  );

  assert.equal(musicResponse.rankingResult?.selfRank, -1);
  assert.equal(musicResponse.rankingResult?.selfScore, -9_007_199_254_740_997n);
  assert.equal(musicResponse.rankingResult?.rankInfos[0]?.rank, 12);
  assert.equal(
    musicResponse.rankingResult?.rankInfos[0]?.score,
    9_007_199_254_740_993n,
  );
  assert.equal(
    musicResponse.rankingResult?.rankInfos[0]?.userInfo?.userProfileInfo?.name,
    "top player",
  );
  assert.equal(
    musicResponse.rankingResult?.rankInfos[0]?.userInfo?.userProfileInfo
      ?.emblemPositions[0]?.emblemId,
    "emblem-id",
  );
  assert.equal(
    musicResponse.rankingResult?.rankInfos[0]?.userInfo?.userProfileInfo
      ?.loginStatusLastUpdatedTime,
    1_700_000_000_000n,
  );
  assert.equal(scoreResponse.result?.isSelfRankOutOfRange, true);
  assert.equal(scoreResponse.result?.rankInfos.length, 1);
});

void test("declares read-only Marathon ranking RPC request policies", () => {
  const methods = [
    MARATHON_TOP,
    MARATHON_LIST_MUSIC_HIGHEST_SCORE_RANKING_GRADE,
    MARATHON_LIST_MUSIC_HIGHEST_SCORE_RANKING_TOP,
    MARATHON_LIST_SCORE_RANKING_GRADE,
    MARATHON_LIST_SCORE_RANKING_TOP,
    MARATHON_LIST_TOTAL_MUSIC_HIGHEST_SCORE_RANKING_GRADE,
    MARATHON_LIST_TOTAL_MUSIC_HIGHEST_SCORE_RANKING_TOP,
  ];
  assert.equal(methods.length, 7);
  for (const method of methods) {
    assert.equal(method.requiresGameAuth, true);
    assert.equal(method.requiresMasterVersion, true);
    assert.equal(method.usesResponseCache, true);
    assert.equal(method.requiresRequestSignature, false);
  }
});
