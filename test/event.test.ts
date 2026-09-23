import assert from "node:assert/strict";
import { test } from "vitest";

import {
  decodeEventListEventInfoForPortalResponse,
  decodeEventListEventInfoResponse,
} from "../src/codecs/event.js";
import {
  encodeBytesField,
  encodeMessage,
  encodeStringField,
  encodeVarintField,
} from "../src/low-level.js";
import {
  EVENT_LIST_EVENT_INFO,
  EVENT_LIST_EVENT_INFO_FOR_PORTAL,
  EventApi,
} from "../src/services/event.js";
import { authenticatedCaller } from "./support/authenticated-caller.js";

function portalEvent(): Buffer {
  return encodeMessage(
    encodeStringField(1, "event-001"),
    encodeVarintField(2, 2),
    encodeStringField(3, "Event name"),
    encodeVarintField(4, 1_700_000_000_000n),
    encodeVarintField(5, 1_700_100_000_000n),
    encodeVarintField(6, 1_700_200_000_000n),
    encodeStringField(7, "event-logo"),
    encodeStringField(8, "event-bg"),
    encodeVarintField(9, 1),
    encodeVarintField(10, 1),
    encodeStringField(11, "mission-group"),
    encodeStringField(12, "view-condition"),
    encodeStringField(13, "unlock-condition"),
  );
}

void test("decodes portal event summaries", () => {
  assert.deepEqual(
    decodeEventListEventInfoForPortalResponse(
      encodeBytesField(1, portalEvent()),
    ),
    {
      eventInfos: [
        {
          eventId: "event-001",
          type: 2,
          name: "Event name",
          startTime: 1_700_000_000_000n,
          endTime: 1_700_100_000_000n,
          exchangeEndTime: 1_700_200_000_000n,
          logoAssetId: "event-logo",
          backgroundAssetId: "event-bg",
          isNew: true,
          isNoti: true,
          missionGroupId: "mission-group",
          viewConditionGroupId: "view-condition",
          unlockConditionGroupId: "unlock-condition",
        },
      ],
    },
  );
});

void test("decodes detailed Marathon chapters, rewards, and bonuses", () => {
  const reward = encodeMessage(
    encodeVarintField(1, 3),
    encodeStringField(2, "item-1"),
    encodeVarintField(3, 25),
  );
  const chapter = encodeMessage(
    encodeStringField(1, "chapter-1"),
    encodeVarintField(2, 1),
    encodeStringField(3, "character-1"),
    encodeVarintField(4, 1_700_100_000_000n),
    encodeStringField(5, "Score"),
    encodeStringField(6, "score-icon"),
    encodeStringField(7, "badge-item"),
    encodeStringField(8, "chapter-missions"),
    encodeBytesField(
      9,
      encodeMessage(encodeVarintField(1, 1000), encodeBytesField(2, reward)),
    ),
    encodeVarintField(10, 1000),
    encodeStringField(11, "story-chapter"),
    encodeStringField(12, "auto-story"),
    encodeStringField(13, "chapter-bg"),
    encodeStringField(14, "chapter-bgm"),
    encodeVarintField(15, 1_700_050_000_000n),
    encodeBytesField(
      16,
      encodeMessage(
        encodeStringField(1, "rank-group"),
        encodeVarintField(2, 10),
        encodeBytesField(3, reward),
        encodeStringField(4, "grade-1"),
      ),
    ),
    encodeBytesField(
      17,
      encodeMessage(
        encodeStringField(1, "music-rank-group"),
        encodeStringField(2, "music-1"),
        encodeVarintField(3, 5),
        encodeBytesField(4, reward),
        encodeStringField(5, "grade-2"),
      ),
    ),
    encodeBytesField(
      18,
      encodeMessage(
        encodeStringField(1, "total-rank-group"),
        encodeVarintField(2, 3),
        encodeBytesField(3, reward),
        encodeStringField(4, "grade-3"),
      ),
    ),
    encodeBytesField(
      19,
      encodeMessage(
        encodeStringField(1, "music-bonus"),
        encodeStringField(2, "music-1"),
        encodeVarintField(3, 1),
        encodeStringField(4, "character-1"),
        encodeStringField(5, "card-1"),
        encodeVarintField(6, 2),
        encodeVarintField(7, 3),
        encodeVarintField(8, 4),
        encodeVarintField(9, 150),
      ),
    ),
    encodeBytesField(
      20,
      encodeMessage(
        encodeStringField(1, "mini-bonus"),
        encodeVarintField(2, 2),
        encodeStringField(3, "card-2"),
        encodeVarintField(4, 3),
        encodeVarintField(5, 5),
        encodeVarintField(6, 200),
      ),
    ),
    encodeBytesField(
      21,
      encodeMessage(
        encodeStringField(1, "live-bonus"),
        encodeVarintField(2, 3),
        encodeStringField(3, "character-1"),
        encodeStringField(4, "card-3"),
        encodeVarintField(5, 1),
        encodeVarintField(6, 4),
        encodeVarintField(7, 6),
        encodeVarintField(8, 250),
      ),
    ),
    encodeBytesField(
      22,
      encodeMessage(
        encodeStringField(1, "game-rate"),
        encodeVarintField(2, 4),
        encodeVarintField(3, 1500),
        encodeVarintField(4, 50),
      ),
    ),
  );
  const event = Buffer.concat([
    portalEvent(),
    encodeBytesField(
      14,
      encodeMessage(
        encodeStringField(1, "exchange-group"),
        encodeVarintField(2, 1_700_000_000_000n),
        encodeVarintField(3, 1_700_200_000_000n),
        encodeBytesField(4, chapter),
        encodeVarintField(5, 1),
        encodeVarintField(6, 2),
      ),
    ),
  ]);
  const result = decodeEventListEventInfoResponse(encodeBytesField(1, event));
  const detailed = result.eventInfos[0];

  assert.equal(detailed?.eventId, "event-001");
  assert.equal(detailed?.marathonInfo?.exchangeBoothGroupId, "exchange-group");
  assert.equal(detailed?.marathonInfo?.marathonChapters.length, 1);
  assert.deepEqual(detailed?.marathonInfo?.marathonChapters[0], {
    id: "chapter-1",
    chapterNumber: 1,
    characterId: "character-1",
    endTime: 1_700_100_000_000n,
    scoreName: "Score",
    scoreIconAssetId: "score-icon",
    marathonEventBadgeItemId: "badge-item",
    missionGroupId: "chapter-missions",
    marathonScoreRewards: [
      {
        score: 1000n,
        rewards: [{ resourceType: 3, resourceId: "item-1", quantity: 25n }],
      },
    ],
    score: 1000n,
    eventStoryChapterId: "story-chapter",
    autoPlayStoryId: "auto-story",
    backgroundAssetId: "chapter-bg",
    bgmAssetId: "chapter-bgm",
    rankingRevealStartTime: 1_700_050_000_000n,
    marathonScoreRankingRankRewards: [
      {
        groupId: "rank-group",
        endRank: 10n,
        rewards: [{ resourceType: 3, resourceId: "item-1", quantity: 25n }],
        marathonRankingGradeId: "grade-1",
      },
    ],
    marathonMusicHighestScoreRankingRankRewards: [
      {
        groupId: "music-rank-group",
        musicId: "music-1",
        endRank: 5n,
        rewards: [{ resourceType: 3, resourceId: "item-1", quantity: 25n }],
        marathonRankingGradeId: "grade-2",
      },
    ],
    marathonTotalMusicHighestScoreRankingRewards: [
      {
        groupId: "total-rank-group",
        endRank: 3n,
        rewards: [{ resourceType: 3, resourceId: "item-1", quantity: 25n }],
        marathonRankingGradeId: "grade-3",
      },
    ],
    marathonMusicScoreBonuses: [
      {
        groupId: "music-bonus",
        musicId: "music-1",
        number: 1,
        characterId: "character-1",
        cardId: "card-1",
        cardAttributeType: 2,
        cardRarity: 3,
        cardPotentialUpgradeCount: 4n,
        scoreUpPermilUp: 150,
      },
    ],
    marathonMiniGameMarathonScoreBonuses: [
      {
        groupId: "mini-bonus",
        number: 2,
        cardId: "card-2",
        cardRarity: 3,
        cardPotentialUpgradeCount: 5n,
        marathonScoreQuantityUpPermilUp: 200,
      },
    ],
    marathonLiveMarathonScoreBonuses: [
      {
        groupId: "live-bonus",
        number: 3,
        characterId: "character-1",
        cardId: "card-3",
        cardAttributeType: 1,
        cardRarity: 4,
        cardPotentialUpgradeCount: 6n,
        marathonScoreQuantityUpPermilUp: 250,
      },
    ],
    marathonMiniGameScoreRates: [
      {
        groupId: "game-rate",
        miniGameType: 4,
        marathonScorePermilMultiply: 1500,
        bonusPermilUp: 50,
      },
    ],
  });
  assert.equal(detailed?.marathonInfo?.tipsHintType, 2);
  assert.equal(detailed?.marathonInfo?.isMarathonScoreRankingDisable, true);
});

void test("EventApi authenticates both cached event reads", async () => {
  let authenticationCalls = 0;
  const calls: string[] = [];
  const api = new EventApi(
    authenticatedCaller(
      {
        call: (method: { path: string }) => {
          calls.push(method.path);
          return Promise.resolve({ eventInfos: [] });
        },
      } as never,
      () => {
        authenticationCalls += 1;
        return Promise.resolve();
      },
    ),
  );

  await api.listEventInfo();
  await api.listEventInfoForPortal();

  assert.equal(authenticationCalls, 2);
  assert.deepEqual(calls, [
    "/rpc.api.Event/ListEventInfo",
    "/rpc.api.Event/ListEventInfoForPortal",
  ]);
  for (const method of [
    EVENT_LIST_EVENT_INFO,
    EVENT_LIST_EVENT_INFO_FOR_PORTAL,
  ]) {
    assert.equal(method.requiresGameAuth, true);
    assert.equal(method.requiresMasterVersion, true);
    assert.equal(method.usesResponseCache, true);
    assert.equal(method.requiresRequestSignature, false);
    assert.deepEqual(method.encode(undefined), Buffer.alloc(0));
  }
});
