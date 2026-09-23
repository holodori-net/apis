import assert from "node:assert/strict";
import { test } from "vitest";

import {
  decodeMusicCreativeChartGetByIdResponse,
  decodeMusicCreativeChartGetCreatorInfoResponse,
  decodeMusicCreativeChartGetEarlyClearLiveDeckResponse,
  decodeMusicCreativeChartGetEarlyClearRankingInfoResponse,
  decodeMusicCreativeChartGetQuoteTargetChartResponse,
  decodeMusicCreativeChartListByCreatorResponse,
  decodeMusicCreativeChartListPopularCreatorResponse,
  decodeMusicCreativeChartListResponse,
  encodeMusicCreativeChartGetByIdRequest,
  encodeMusicCreativeChartGetEarlyClearLiveDeckRequest,
  encodeMusicCreativeChartGetEarlyClearRankingInfoRequest,
  encodeMusicCreativeChartIdRequest,
  encodeMusicCreativeChartListByCreatorRequest,
  encodeMusicCreativeChartListPopularCreatorRequest,
  encodeMusicCreativeChartListRequest,
} from "../src/codecs/music-creative-chart.js";
import {
  decodeProtoFields,
  encodeBytesField,
  encodeMessage,
  encodeStringField,
  encodeVarintField,
} from "../src/low-level.js";
import {
  MUSIC_CREATIVE_CHART_GET_BY_ID,
  MUSIC_CREATIVE_CHART_GET_CREATOR_INFO,
  MUSIC_CREATIVE_CHART_GET_EARLY_CLEAR_LIVE_DECK,
  MUSIC_CREATIVE_CHART_GET_EARLY_CLEAR_RANKING_INFO,
  MUSIC_CREATIVE_CHART_GET_QUOTE_TARGET,
  MUSIC_CREATIVE_CHART_LIST_BY_CREATOR,
  MUSIC_CREATIVE_CHART_LIST_NEWER,
  MUSIC_CREATIVE_CHART_LIST_POPULAR,
  MUSIC_CREATIVE_CHART_LIST_POPULAR_CREATOR,
} from "../src/services/music-creative-chart.js";

void test("encodes MusicCreativeChart query requests using contract fields", () => {
  const listRequest = encodeMusicCreativeChartListRequest({
    searchParameter: {
      isSearchAllMusic: true,
      musicIds: ["music-1", "music-2"],
      isQuoteAllowedOnly: true,
      resetIntervalType: 2,
      textSearchTypes: [1, 3],
      searchText: "title",
      difficultyValueFrom: 10,
      difficultyValueTo: 50,
      chartTypes: [1, 2],
      musicCreativeChartTagIds: ["tag-1"],
    },
  });
  const outer = decodeProtoFields(listRequest);
  const search = decodeProtoFields(outer.get(1)?.[0] as Buffer);
  assert.equal(search.get(1)?.[0], 1n);
  assert.deepEqual(search.get(2), [
    Buffer.from("music-1"),
    Buffer.from("music-2"),
  ]);
  assert.equal(search.get(3)?.[0], 1n);
  assert.equal(search.get(4)?.[0], 2n);
  assert.deepEqual(search.get(5), [1n, 3n]);
  assert.equal(search.get(6)?.[0]?.toString(), "title");
  assert.equal(search.get(7)?.[0], 10n);
  assert.equal(search.get(8)?.[0], 50n);
  assert.deepEqual(search.get(9), [1n, 2n]);
  assert.deepEqual(search.get(10), [Buffer.from("tag-1")]);

  const byCreator = decodeProtoFields(
    encodeMusicCreativeChartListByCreatorRequest({
      publicUserId: "public-1",
      searchParameter: { musicIds: ["music-1"] },
    }),
  );
  assert.equal(byCreator.get(1)?.[0]?.toString(), "public-1");
  assert.ok(Buffer.isBuffer(byCreator.get(2)?.[0]));

  assert.deepEqual(
    [
      ...decodeProtoFields(
        encodeMusicCreativeChartListPopularCreatorRequest({
          resetIntervalType: 3,
        }),
      ),
    ],
    [[1, [3n]]],
  );
  assert.deepEqual(
    [
      ...decodeProtoFields(
        encodeMusicCreativeChartGetByIdRequest({
          musicCreativeChartId: "chart-1",
          isQuoteAllowedOnly: true,
        }),
      ),
    ],
    [
      [1, [Buffer.from("chart-1")]],
      [2, [1n]],
    ],
  );
  assert.deepEqual(
    [
      ...decodeProtoFields(
        encodeMusicCreativeChartIdRequest({ musicCreativeChartId: "chart-1" }),
      ),
    ],
    [[1, [Buffer.from("chart-1")]]],
  );
  assert.deepEqual(
    [
      ...decodeProtoFields(
        encodeMusicCreativeChartGetEarlyClearRankingInfoRequest({
          musicCreativeChartId: "chart-1",
          liveResultType: 2,
        }),
      ),
    ],
    [
      [1, [Buffer.from("chart-1")]],
      [2, [2n]],
    ],
  );
  assert.deepEqual(
    [
      ...decodeProtoFields(
        encodeMusicCreativeChartGetEarlyClearLiveDeckRequest({
          publicUserId: "public-1",
          musicCreativeChartId: "chart-1",
          liveResultType: 3,
        }),
      ),
    ],
    [
      [1, [Buffer.from("public-1")]],
      [2, [Buffer.from("chart-1")]],
      [3, [3n]],
    ],
  );
  assert.throws(
    () => encodeMusicCreativeChartGetByIdRequest({ musicCreativeChartId: "" }),
    /must not be empty/,
  );
});

void test("rejects invalid MusicCreativeChart query parameters", () => {
  assert.throws(
    () =>
      encodeMusicCreativeChartListRequest({
        searchParameter: { musicIds: ["music-1", "music-1"] },
      }),
    /music IDs must be unique/,
  );
  assert.throws(
    () =>
      encodeMusicCreativeChartListRequest({
        searchParameter: { chartTypes: [0] },
      }),
    /chart types must be a positive integer/,
  );
  assert.throws(
    () =>
      encodeMusicCreativeChartListRequest({
        searchParameter: {
          difficultyValueFrom: 20,
          difficultyValueTo: 10,
        },
      }),
    /minimum difficulty value must not exceed maximum difficulty value/,
  );
  assert.throws(
    () =>
      encodeMusicCreativeChartGetEarlyClearRankingInfoRequest({
        musicCreativeChartId: "chart-1",
        liveResultType: 0,
      }),
    /live result type must be a positive integer/,
  );
});

void test("declares public MusicCreativeChart reads with contract policies", () => {
  const methods = [
    MUSIC_CREATIVE_CHART_LIST_NEWER,
    MUSIC_CREATIVE_CHART_LIST_POPULAR,
    MUSIC_CREATIVE_CHART_LIST_POPULAR_CREATOR,
    MUSIC_CREATIVE_CHART_LIST_BY_CREATOR,
    MUSIC_CREATIVE_CHART_GET_BY_ID,
    MUSIC_CREATIVE_CHART_GET_QUOTE_TARGET,
    MUSIC_CREATIVE_CHART_GET_CREATOR_INFO,
    MUSIC_CREATIVE_CHART_GET_EARLY_CLEAR_RANKING_INFO,
    MUSIC_CREATIVE_CHART_GET_EARLY_CLEAR_LIVE_DECK,
  ];
  for (const method of methods) {
    assert.equal(method.requiresGameAuth, true);
    assert.equal(method.requiresMasterVersion, true);
    assert.equal(method.usesResponseCache, true);
    assert.equal(method.requiresRequestSignature, false);
  }
  assert.equal(
    MUSIC_CREATIVE_CHART_GET_BY_ID.path,
    "/rpc.api.MusicCreativeChart/GetByMusicCreativeChartId",
  );
});

void test("decodes MusicCreativeChart discovery, creator, and ranking responses", () => {
  const chart = encodeMessage(
    encodeStringField(1, "chart-1"),
    encodeStringField(2, "music-1"),
    encodeStringField(3, "Creator"),
    encodeVarintField(4, 1),
    encodeStringField(5, "Chart title"),
    encodeStringField(6, "https://cdn/thumb.png"),
    encodeVarintField(7, 42),
    encodeBytesField(8, Buffer.from([1, 2])),
    encodeStringField(9, "tag-1"),
    encodeVarintField(10, 100),
    encodeVarintField(11, 70),
    encodeVarintField(12, 20),
    encodeVarintField(13, 10),
    encodeVarintField(14, 5_000_000_000n),
    encodeVarintField(15, 9_000_000_000n),
    encodeVarintField(16, 2),
    encodeVarintField(17, 3),
    encodeStringField(18, "https://cdn/preview.png"),
    encodeVarintField(19, 1),
  );
  const grouped = decodeMusicCreativeChartListResponse(
    encodeBytesField(
      1,
      encodeMessage(
        encodeStringField(1, "music-1"),
        encodeBytesField(2, chart),
      ),
    ),
  );
  assert.equal(
    grouped.chartInfoMusicGroupings[0]?.chartInfos[0]?.musicCreativeChartId,
    "chart-1",
  );
  assert.deepEqual(
    grouped.chartInfoMusicGroupings[0]?.chartInfos[0]?.chartTypes,
    [1, 2],
  );
  assert.equal(
    grouped.chartInfoMusicGroupings[0]?.chartInfos[0]?.likeCount,
    5_000_000_000n,
  );
  assert.equal(grouped.chartInfoMusicGroupings[0]?.chartInfos[0]?.isOwn, true);

  assert.equal(
    decodeMusicCreativeChartListByCreatorResponse(encodeBytesField(1, chart))
      .chartInfos[0]?.title,
    "Chart title",
  );
  assert.equal(
    decodeMusicCreativeChartGetByIdResponse(encodeBytesField(1, chart))
      .chartInfo?.playCount,
    9_000_000_000n,
  );

  const basicUser = encodeMessage(
    encodeStringField(1, "public-1"),
    encodeBytesField(2, encodeMessage(encodeStringField(1, "Creator name"))),
  );
  const popularCreators = decodeMusicCreativeChartListPopularCreatorResponse(
    encodeBytesField(
      1,
      encodeMessage(
        encodeBytesField(1, basicUser),
        encodeVarintField(2, 12),
        encodeVarintField(3, 99),
      ),
    ),
  );
  assert.equal(
    popularCreators.creatorInfos[0]?.userInfo?.publicUserId,
    "public-1",
  );
  assert.equal(popularCreators.creatorInfos[0]?.publishedChartCount, 12n);

  const creator = decodeMusicCreativeChartGetCreatorInfoResponse(
    encodeMessage(
      encodeBytesField(1, basicUser),
      encodeStringField(2, "public-2"),
      encodeBytesField(3, basicUser),
    ),
  );
  assert.equal(creator.creatorUserInfo?.userProfileInfo?.name, "Creator name");
  assert.deepEqual(creator.relatedCreatorPublicUserIds, ["public-2"]);
  assert.equal(creator.relatedCreatorUserInfos[0]?.publicUserId, "public-1");

  assert.equal(
    decodeMusicCreativeChartGetQuoteTargetChartResponse(
      encodeStringField(1, "https://cdn/chart-file"),
    ).chartFileUrl,
    "https://cdn/chart-file",
  );

  const rank = encodeMessage(
    encodeVarintField(1, 7),
    encodeVarintField(2, 123_456),
    encodeBytesField(3, basicUser),
  );
  const earlyRanking = decodeMusicCreativeChartGetEarlyClearRankingInfoResponse(
    encodeMessage(encodeBytesField(1, rank), encodeVarintField(2, 10)),
  );
  assert.equal(earlyRanking.rankInfos[0]?.userInfo?.publicUserId, "public-1");
  assert.equal(earlyRanking.selfRankingRank, 10);

  const earlyDeck = decodeMusicCreativeChartGetEarlyClearLiveDeckResponse(
    encodeBytesField(
      1,
      encodeMessage(
        encodeStringField(1, "character-1"),
        encodeStringField(2, "costume-1"),
        encodeVarintField(4, 500_000),
      ),
    ),
  );
  assert.equal(earlyDeck.rankingLiveDeckInfo?.characterId, "character-1");
  assert.equal(earlyDeck.rankingLiveDeckInfo?.deckPower, 500_000n);
});
