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
  LIVE_GET_DECK,
  LIVE_GET_DECK_CANDIDATE_CARD_PARAMETERS,
  LIVE_GET_DRAFT_DECK_INFO,
} from "../src/services/live.js";

void test("encodes Live deck requests with contract field numbers", () => {
  assert.deepEqual(
    [
      ...decodeProtoFields(
        LIVE_GET_DECK_CANDIDATE_CARD_PARAMETERS.encode({
          characterId: "character-1",
          costumeId: "costume-1",
          musicId: "music-1",
        }),
      ),
    ].map(([field, values]) => [field, values[0]]),
    [
      [1, Buffer.from("character-1")],
      [2, Buffer.from("costume-1")],
      [3, Buffer.from("music-1")],
    ],
  );

  const draft = decodeProtoFields(
    LIVE_GET_DRAFT_DECK_INFO.encode({
      characterId: "character-1",
      costumeId: "costume-1",
      deckPositions: [{ position: 1, cardId: "card-1" }],
      musicId: "music-1",
    }),
  );
  assert.equal(draft.get(3)?.length, 1);
  assert.deepEqual(draft.get(4), [Buffer.from("music-1")]);
  assert.deepEqual(
    [...decodeProtoFields(draft.get(3)?.[0] as Buffer)].map(
      ([field, values]) => [field, values[0]],
    ),
    [
      [1, 1n],
      [2, Buffer.from("card-1")],
    ],
  );

  assert.deepEqual(
    [
      ...decodeProtoFields(
        LIVE_GET_DECK.encode({
          characterId: "character-1",
          number: 2,
        }),
      ),
    ],
    [
      [1, [Buffer.from("character-1")]],
      [2, [2n]],
    ],
  );
});

void test("declares the Live read methods as authenticated cached calls", () => {
  for (const method of [
    LIVE_GET_DECK_CANDIDATE_CARD_PARAMETERS,
    LIVE_GET_DRAFT_DECK_INFO,
    LIVE_GET_DECK,
  ]) {
    assert.equal(method.requiresGameAuth, true);
    assert.equal(method.requiresMasterVersion, true);
    assert.equal(method.usesResponseCache, true);
    assert.equal(method.requiresRequestSignature, false);
  }
});

void test("decodes Live/Get nested evaluation and in-game effects", () => {
  const deckPosition = encodeMessage(
    encodeVarintField(1, 1),
    encodeStringField(2, "card-1"),
    encodeVarintField(3, 12_345n),
  );
  const liveDeckPower = encodeMessage(
    encodeVarintField(1, 30_000n),
    encodeVarintField(2, 3),
    encodeVarintField(3, 1),
    encodeVarintField(4, 100n),
    encodeVarintField(5, 200n),
    encodeVarintField(6, 300n),
    encodeVarintField(7, 400n),
    encodeVarintField(8, 500n),
    encodeVarintField(9, 600n),
  );
  const scoreUp = encodeMessage(
    encodeVarintField(1, 700n),
    encodeVarintField(2, 4),
    encodeVarintField(3, 2),
    encodeVarintField(4, 10n),
    encodeVarintField(5, 20n),
    encodeVarintField(6, 30n),
    encodeVarintField(7, 40n),
    encodeVarintField(8, 50n),
  );
  const evaluation = encodeMessage(
    encodeVarintField(1, 80_000n),
    encodeVarintField(2, 5),
    encodeVarintField(3, 2),
    encodeBytesField(4, liveDeckPower),
    encodeBytesField(5, scoreUp),
  );
  const activeSkill = encodeMessage(
    encodeStringField(1, "active-1"),
    encodeVarintField(2, 2),
  );
  const effectPosition = encodeMessage(
    encodeVarintField(1, 1),
    encodeStringField(2, "card-1"),
    encodeVarintField(3, 1_000n),
    encodeVarintField(4, 2_000n),
    encodeVarintField(5, 3_000n),
  );
  const effect = encodeMessage(
    encodeVarintField(1, 3),
    encodeBytesField(2, activeSkill),
    encodeBytesField(100, effectPosition),
  );

  const response = LIVE_GET_DECK.decode(
    encodeMessage(
      encodeBytesField(1, deckPosition),
      encodeBytesField(2, evaluation),
      encodeBytesField(3, effect),
    ),
  );

  assert.equal(response.deckPositions[0]?.liveDeckPower, 12_345n);
  assert.equal(
    response.liveDeckEvaluation?.liveDeckPower?.cardParameterUpBySkillTree,
    400n,
  );
  assert.equal(
    response.liveDeckEvaluation?.liveDeckEvaluationScoreUpPermilUp
      ?.scoreUpPermilUpByLiveSpecialSkill,
    50n,
  );
  assert.equal(response.liveDeckInGameEffect?.lifeUp, 3);
  assert.equal(
    response.liveDeckInGameEffect?.liveLeaderActiveSkillLevels[0]?.level,
    2,
  );
  assert.equal(
    response.liveDeckInGameEffect?.liveDeckPositions[0]?.sense,
    3_000n,
  );
});
