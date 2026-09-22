import assert from "node:assert/strict";
import { test } from "vitest";

import {
  decodeUserGetResponse,
  USER_DATA_CARDS_FIELD,
  USER_DATA_CHARACTER_SKILL_TREES_FIELD,
  USER_DATA_CHARACTERS_FIELD,
  USER_DATA_COSTUMES_FIELD,
  USER_DATA_ITEMS_FIELD,
  USER_DATA_LIVE_DECK_POSITIONS_FIELD,
  USER_DATA_LIVE_DECKS_FIELD,
  USER_DATA_MUSIC_CHARACTER_HIGHEST_SCORES_FIELD,
  USER_DATA_MUSIC_DIFFICULTIES_FIELD,
  USER_DATA_MUSICS_FIELD,
  USER_DATA_SKILL_TREE_POINTS_FIELD,
} from "../src/codecs/user.js";
import { HolodoriApi } from "../src/index.js";
import {
  decodeProtoFields,
  decryptProto,
  encodeBytesField,
  encodeMessage,
  encodeStringField,
  encodeVarint,
  encodeVarintField,
  encryptProto,
} from "../src/low-level.js";
import {
  type ApiTransport,
  type ApiTransportRequest,
  type ApiTransportResponse,
} from "../src/transport.js";

const SECRET = "test-api-secret";

class FakeTransport implements ApiTransport {
  readonly requests: ApiTransportRequest[] = [];
  private readonly responses = new Map<string, Buffer[]>();

  respond(path: string, ...messages: Buffer[]): void {
    this.responses.set(
      path,
      messages.map((message) => encryptProto(message, SECRET)),
    );
  }

  request(request: ApiTransportRequest): Promise<ApiTransportResponse> {
    this.requests.push(request);
    const path = new URL(request.url).pathname;
    const queue = this.responses.get(path);
    if (!queue?.length) throw new Error(`no fake response for ${path}`);
    const responseBody = queue.shift();
    if (!responseBody) throw new Error(`empty fake response for ${path}`);
    return Promise.resolve({
      status: 200,
      headers: {},
      trailers: { "grpc-status": "0" },
      body: responseBody,
    });
  }
}

void test("decodes User/Get cards with the large UserData field number", () => {
  const card = encodeMessage(
    encodeStringField(2, "card-1"),
    encodeVarintField(3, 9_007_199_254_740_993n),
    encodeVarintField(4, 4),
    encodeVarintField(5, 5),
    encodeVarintField(6, 6),
    encodeVarintField(7, 1_700_000_000_000n),
  );
  const response = encodeMessage(
    encodeBytesField(
      1,
      encodeMessage(encodeBytesField(USER_DATA_CARDS_FIELD, card)),
    ),
  );

  assert.deepEqual(decodeUserGetResponse(response), {
    cards: [
      {
        cardId: "card-1",
        exp: 9_007_199_254_740_993n,
        levelLimitBreakCount: 4,
        potentialUpgradeCount: 5,
        potentialUpgradePointQuantity: 6,
        acquiredTime: 1_700_000_000_000n,
      },
    ],
    characters: [],
    characterSkillTrees: [],
    costumes: [],
    items: [],
    liveDecks: [],
    liveDeckPositions: [],
    musics: [],
    musicCharacterHighestScores: [],
    musicDifficulties: [],
    skillTreePoints: [],
  });
});

void test("decodes the User/Get simulator snapshot entities", () => {
  const character = encodeMessage(
    encodeStringField(2, "char-1"),
    encodeStringField(3, "costume-1"),
    encodeStringField(4, "sd-costume-1"),
    encodeStringField(5, "hair-1"),
    encodeVarintField(6, 9_007_199_254_740_993n),
    encodeVarintField(7, 100n),
    encodeVarintField(8, 1_700_000_000_000n),
    encodeVarintField(11, 12),
    encodeVarintField(12, 1_700_000_000_001n),
    encodeVarintField(13, 1_700_000_000_002n),
    encodeVarintField(14, 3),
  );
  const skillTree = encodeMessage(
    encodeStringField(2, "char-1"),
    encodeStringField(3, "group-1"),
    encodeStringField(3, "group-2"),
    encodeStringField(4, "connected-1"),
    encodeStringField(5, "card-1"),
  );
  const costume = encodeMessage(
    encodeStringField(2, "costume-1"),
    encodeVarintField(3, 1_700_000_000_003n),
    encodeVarintField(4, 1_700_000_000_004n),
  );
  const item = encodeMessage(
    encodeStringField(2, "item-1"),
    encodeVarintField(3, 1_700_000_000_005n),
    encodeVarintField(4, 9_007_199_254_740_994n),
    encodeVarintField(5, 1_700_000_000_006n),
  );
  const liveDeck = encodeMessage(
    encodeStringField(2, "char-1"),
    encodeVarintField(3, 1),
    encodeStringField(4, "Main"),
    encodeStringField(5, "costume-1"),
  );
  const liveDeckPosition = encodeMessage(
    encodeStringField(2, "char-1"),
    encodeVarintField(3, 1),
    encodeVarintField(4, 0),
    encodeStringField(5, "card-1"),
  );
  const music = encodeMessage(
    encodeStringField(2, "music-1"),
    encodeVarintField(3, 1),
    encodeVarintField(8, 1_700_000_000_007n),
    encodeVarintField(100, 9_007_199_254_740_995n),
    encodeVarintField(101, 1_700_000_000_008n),
    encodeVarintField(102, 2),
    encodeStringField(103, "char-1"),
    encodeStringField(104, "costume-1"),
    encodeStringField(105, "card-1"),
    encodeStringField(105, "card-2"),
    encodeBytesField(106, Buffer.concat([encodeVarint(10), encodeVarint(11)])),
    encodeVarintField(107, 1),
    encodeBytesField(107, encodeVarint(2)),
    encodeBytesField(108, encodeVarint(9_007_199_254_740_996n)),
    encodeBytesField(109, encodeVarint(100)),
    encodeBytesField(110, encodeVarint(101)),
    encodeBytesField(111, encodeVarint(102)),
    encodeBytesField(112, encodeVarint(103)),
    encodeVarintField(113, 500),
    encodeVarintField(114, 600),
    encodeVarintField(115, 3),
  );
  const characterHighestScoreInfo = encodeMessage(
    encodeVarintField(1, 2),
    encodeVarintField(2, 9_007_199_254_740_997n),
    encodeVarintField(3, 98),
    encodeVarintField(4, 1_700_000_000_009n),
  );
  const characterHighestScore = encodeMessage(
    encodeStringField(2, "char-1"),
    encodeStringField(3, "music-1"),
    encodeBytesField(100, characterHighestScoreInfo),
  );
  const musicDifficulty = encodeMessage(
    encodeStringField(2, "music-1"),
    encodeVarintField(3, 2),
    encodeVarintField(4, 900),
    encodeVarintField(5, 800),
    encodeStringField(6, "char-1"),
    encodeVarintField(7, 1000),
    encodeVarintField(8, 4),
    encodeVarintField(9, 1),
    encodeVarintField(1000, 700),
  );
  const skillTreePoint = encodeMessage(
    encodeStringField(2, "point-1"),
    encodeVarintField(3, 9_007_199_254_740_998n),
  );

  const userData = encodeMessage(
    encodeBytesField(USER_DATA_CHARACTERS_FIELD, character),
    encodeBytesField(USER_DATA_CHARACTER_SKILL_TREES_FIELD, skillTree),
    encodeBytesField(USER_DATA_COSTUMES_FIELD, costume),
    encodeBytesField(USER_DATA_ITEMS_FIELD, item),
    encodeBytesField(USER_DATA_LIVE_DECKS_FIELD, liveDeck),
    encodeBytesField(USER_DATA_LIVE_DECK_POSITIONS_FIELD, liveDeckPosition),
    encodeBytesField(USER_DATA_MUSICS_FIELD, music),
    encodeBytesField(
      USER_DATA_MUSIC_CHARACTER_HIGHEST_SCORES_FIELD,
      characterHighestScore,
    ),
    encodeBytesField(USER_DATA_MUSIC_DIFFICULTIES_FIELD, musicDifficulty),
    encodeBytesField(USER_DATA_SKILL_TREE_POINTS_FIELD, skillTreePoint),
  );

  const snapshot = decodeUserGetResponse(encodeBytesField(1, userData));
  assert.deepEqual(snapshot.characters, [
    {
      characterId: "char-1",
      costumeId: "costume-1",
      sdCostumeId: "sd-costume-1",
      sdCostumeHairAccessoryId: "hair-1",
      exp: 9_007_199_254_740_993n,
      highestLiveDeckEvaluationValue: 100n,
      acquiredTime: 1_700_000_000_000n,
      lastRewardReceivedLevel: 12,
      readTime: 1_700_000_000_001n,
      parkReadTime: 1_700_000_000_002n,
      lastWatchedLiveDeckNumber: 3,
    },
  ]);
  assert.deepEqual(snapshot.characterSkillTrees, [
    {
      characterId: "char-1",
      releasedSkillTreeNodeGroupIds: ["group-1", "group-2"],
      connectedSkillTreeNodeGroupIds: ["connected-1"],
      connectedSkillTreeNodeCardIds: ["card-1"],
    },
  ]);
  assert.deepEqual(snapshot.costumes, [
    {
      costumeId: "costume-1",
      acquiredTime: 1_700_000_000_003n,
      readTime: 1_700_000_000_004n,
    },
  ]);
  assert.deepEqual(snapshot.items, [
    {
      itemId: "item-1",
      expiredTime: 1_700_000_000_005n,
      quantity: 9_007_199_254_740_994n,
      lastAcquiredTime: 1_700_000_000_006n,
    },
  ]);
  assert.deepEqual(snapshot.liveDecks, [
    { characterId: "char-1", number: 1, name: "Main", costumeId: "costume-1" },
  ]);
  assert.deepEqual(snapshot.liveDeckPositions, [
    { characterId: "char-1", number: 1, position: 0, cardId: "card-1" },
  ]);
  assert.deepEqual(snapshot.musics, [
    {
      musicId: "music-1",
      isFavorite: true,
      releasedTime: 1_700_000_000_007n,
      highestScore: 9_007_199_254_740_995n,
      highestScoreLastUpdatedTime: 1_700_000_000_008n,
      highestScoreMusicDifficultyType: 2,
      highestScoreCharacterId: "char-1",
      highestScoreCostumeId: "costume-1",
      highestScoreDeckCardIds: ["card-1", "card-2"],
      highestScoreDeckCardLevels: [10, 11],
      highestScoreDeckCardPotentialUpgradeCounts: [1, 2],
      highestScoreDeckCardLiveDeckPowers: [9_007_199_254_740_996n],
      highestScoreDeckCardParametersForCardDetail: [100n],
      highestScoreDeckCardPerformancesForCardDetail: [101n],
      highestScoreDeckCardTechniquesForCardDetail: [102n],
      highestScoreDeckCardSensesForCardDetail: [103n],
      highestScoreDeckPower: 500n,
      highestScoreDeckEvaluationValue: 600n,
      receivedHighestScoreEvaluationRankRewardRankType: 3,
    },
  ]);
  assert.deepEqual(snapshot.musicCharacterHighestScores, [
    {
      characterId: "char-1",
      musicId: "music-1",
      highestScoreInfos: [
        {
          difficultyType: 2,
          highestScore: 9_007_199_254_740_997n,
          highestScoreRatingValue: 98n,
          highestScoreLastUpdatedTime: 1_700_000_000_009n,
        },
      ],
    },
  ]);
  assert.deepEqual(snapshot.musicDifficulties, [
    {
      musicId: "music-1",
      difficultyType: 2,
      highestScore: 900n,
      nonHighestScoreRatingCharacterHighestScore: 800n,
      nonHighestScoreRatingCharacterHighestScoreCharacterId: "char-1",
      maxComboCount: 1000n,
      clearCount: 4n,
      liveResultType: 1,
      technicalHighestScore: 700n,
    },
  ]);
  assert.deepEqual(snapshot.skillTreePoints, [
    { skillTreePointId: "point-1", quantity: 9_007_199_254_740_998n },
  ]);
});

void test("lazily authenticates and lists cards without a request ID", async () => {
  const transport = new FakeTransport();
  transport.respond(
    "/rpc.api.Auth/Create",
    encodeMessage(encodeStringField(1, "credential-1")),
  );
  transport.respond(
    "/rpc.api.Auth/Login",
    encodeMessage(encodeStringField(1, "token-1")),
  );
  transport.respond(
    "/rpc.api.Master/Get",
    encodeMessage(encodeStringField(1, "master-1")),
  );
  const card = encodeMessage(encodeStringField(2, "card-1"));
  transport.respond(
    "/rpc.api.User/Get",
    encodeMessage(
      encodeBytesField(
        1,
        encodeMessage(encodeBytesField(USER_DATA_CARDS_FIELD, card)),
      ),
    ),
    encodeMessage(encodeBytesField(1, encodeMessage())),
  );

  const api = await HolodoriApi.create(
    { appVersion: "1.1.0", apiSecret: SECRET, autoAuthenticate: false },
    transport,
  );
  const cards = await api.user.listCards();
  const snapshot = await api.user.getSnapshot();

  assert.equal(cards.length, 1);
  assert.equal(cards[0]?.cardId, "card-1");
  assert.equal(snapshot.cards.length, 0);
  assert.equal(snapshot.characters.length, 0);
  assert.deepEqual(
    transport.requests.map((request) => new URL(request.url).pathname),
    [
      "/rpc.api.Auth/Create",
      "/rpc.api.Auth/Login",
      "/rpc.api.Master/Get",
      "/rpc.api.User/Get",
      "/rpc.api.User/Get",
    ],
  );
  const userRequest = transport.requests.at(-1);
  assert.equal(userRequest?.headers?.["x-app-auth-token"], "token-1");
  assert.equal(userRequest?.headers?.["x-app-master-version"], "master-1");
  assert.equal(userRequest?.headers?.["x-app-request-id"], undefined);
  assert.equal(
    decodeProtoFields(
      decryptProto(userRequest?.body ?? Buffer.alloc(0), SECRET),
    ).size,
    0,
  );
});
