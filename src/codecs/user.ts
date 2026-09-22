import {
  firstBool,
  firstString,
  firstUint,
  requireString,
} from "../protobuf.js";
import {
  decodeProtoFields,
  encodeEmpty,
  isBuffer,
  type ProtoValue,
  toSafeNumber,
} from "./common.js";

export const USER_DATA_CARDS_FIELD = 315_485_766;
export const USER_DATA_CHARACTERS_FIELD = 370_704_040;
export const USER_DATA_CHARACTER_SKILL_TREES_FIELD = 73_736_905;
export const USER_DATA_COSTUMES_FIELD = 469_968_532;
export const USER_DATA_ITEMS_FIELD = 208_896_283;
export const USER_DATA_LIVE_DECKS_FIELD = 470_144_554;
export const USER_DATA_LIVE_DECK_POSITIONS_FIELD = 152_863_089;
export const USER_DATA_MUSICS_FIELD = 430_828_780;
export const USER_DATA_MUSIC_CHARACTER_HIGHEST_SCORES_FIELD = 344_424_884;
export const USER_DATA_MUSIC_DIFFICULTIES_FIELD = 38_601_170;
export const USER_DATA_SKILL_TREE_POINTS_FIELD = 83_652_733;

export interface AccountCard {
  readonly cardId: string;
  readonly exp: bigint;
  readonly levelLimitBreakCount: number;
  readonly potentialUpgradeCount: number;
  readonly potentialUpgradePointQuantity: number;
  readonly acquiredTime: bigint;
}

export interface UserCharacter {
  readonly characterId: string;
  readonly costumeId: string;
  readonly sdCostumeId: string;
  readonly sdCostumeHairAccessoryId: string;
  readonly exp: bigint;
  readonly highestLiveDeckEvaluationValue: bigint;
  readonly acquiredTime: bigint;
  readonly lastRewardReceivedLevel: number;
  readonly readTime: bigint;
  readonly parkReadTime: bigint;
  readonly lastWatchedLiveDeckNumber: number;
}

export interface UserCharacterSkillTree {
  readonly characterId: string;
  readonly releasedSkillTreeNodeGroupIds: readonly string[];
  readonly connectedSkillTreeNodeGroupIds: readonly string[];
  readonly connectedSkillTreeNodeCardIds: readonly string[];
}

export interface UserCostume {
  readonly costumeId: string;
  readonly acquiredTime: bigint;
  readonly readTime: bigint;
}

export interface UserItem {
  readonly itemId: string;
  readonly expiredTime: bigint;
  readonly quantity: bigint;
  readonly lastAcquiredTime: bigint;
}

export interface UserLiveDeck {
  readonly characterId: string;
  readonly number: number;
  readonly name: string;
  readonly costumeId: string;
}

export interface UserLiveDeckPosition {
  readonly characterId: string;
  readonly number: number;
  readonly position: number;
  readonly cardId: string;
}

export interface UserMusic {
  readonly musicId: string;
  readonly isFavorite: boolean;
  readonly releasedTime: bigint;
  readonly highestScore: bigint;
  readonly highestScoreLastUpdatedTime: bigint;
  readonly highestScoreMusicDifficultyType: number;
  readonly highestScoreCharacterId: string;
  readonly highestScoreCostumeId: string;
  readonly highestScoreDeckCardIds: readonly string[];
  readonly highestScoreDeckCardLevels: readonly number[];
  readonly highestScoreDeckCardPotentialUpgradeCounts: readonly number[];
  readonly highestScoreDeckCardLiveDeckPowers: readonly bigint[];
  readonly highestScoreDeckCardParametersForCardDetail: readonly bigint[];
  readonly highestScoreDeckCardPerformancesForCardDetail: readonly bigint[];
  readonly highestScoreDeckCardTechniquesForCardDetail: readonly bigint[];
  readonly highestScoreDeckCardSensesForCardDetail: readonly bigint[];
  readonly highestScoreDeckPower: bigint;
  readonly highestScoreDeckEvaluationValue: bigint;
  readonly receivedHighestScoreEvaluationRankRewardRankType: number;
}

export interface UserMusicCharacterHighestScoreInfo {
  readonly difficultyType: number;
  readonly highestScore: bigint;
  readonly highestScoreRatingValue: bigint;
  readonly highestScoreLastUpdatedTime: bigint;
}

export interface UserMusicCharacterHighestScore {
  readonly characterId: string;
  readonly musicId: string;
  readonly highestScoreInfos: readonly UserMusicCharacterHighestScoreInfo[];
}

export interface UserMusicDifficulty {
  readonly musicId: string;
  readonly difficultyType: number;
  readonly highestScore: bigint;
  readonly nonHighestScoreRatingCharacterHighestScore: bigint;
  readonly nonHighestScoreRatingCharacterHighestScoreCharacterId: string;
  readonly maxComboCount: bigint;
  readonly clearCount: bigint;
  readonly liveResultType: number;
  readonly technicalHighestScore: bigint;
}

export interface UserSkillTreePoint {
  readonly skillTreePointId: string;
  readonly quantity: bigint;
}

export interface UserDataSnapshot {
  readonly cards: readonly AccountCard[];
  readonly characters: readonly UserCharacter[];
  readonly characterSkillTrees: readonly UserCharacterSkillTree[];
  readonly costumes: readonly UserCostume[];
  readonly items: readonly UserItem[];
  readonly liveDecks: readonly UserLiveDeck[];
  readonly liveDeckPositions: readonly UserLiveDeckPosition[];
  readonly musics: readonly UserMusic[];
  readonly musicCharacterHighestScores: readonly UserMusicCharacterHighestScore[];
  readonly musicDifficulties: readonly UserMusicDifficulty[];
  readonly skillTreePoints: readonly UserSkillTreePoint[];
}

export type UserGetResponse = UserDataSnapshot;

export function encodeUserGetRequest(): Buffer {
  return encodeEmpty();
}

export function decodeUserGetResponse(data: Buffer): UserGetResponse {
  const responseFields = decodeProtoFields(data);
  const userData = responseFields.get(1)?.find(isBuffer);
  if (!userData) throw new Error("User/Get response has no user_data field");

  const userDataFields = decodeProtoFields(userData);
  return {
    cards: decodeRepeated(
      userDataFields,
      USER_DATA_CARDS_FIELD,
      decodeAccountCard,
    ),
    characters: decodeRepeated(
      userDataFields,
      USER_DATA_CHARACTERS_FIELD,
      decodeUserCharacter,
    ),
    characterSkillTrees: decodeRepeated(
      userDataFields,
      USER_DATA_CHARACTER_SKILL_TREES_FIELD,
      decodeUserCharacterSkillTree,
    ),
    costumes: decodeRepeated(
      userDataFields,
      USER_DATA_COSTUMES_FIELD,
      decodeUserCostume,
    ),
    items: decodeRepeated(
      userDataFields,
      USER_DATA_ITEMS_FIELD,
      decodeUserItem,
    ),
    liveDecks: decodeRepeated(
      userDataFields,
      USER_DATA_LIVE_DECKS_FIELD,
      decodeUserLiveDeck,
    ),
    liveDeckPositions: decodeRepeated(
      userDataFields,
      USER_DATA_LIVE_DECK_POSITIONS_FIELD,
      decodeUserLiveDeckPosition,
    ),
    musics: decodeRepeated(
      userDataFields,
      USER_DATA_MUSICS_FIELD,
      decodeUserMusic,
    ),
    musicCharacterHighestScores: decodeRepeated(
      userDataFields,
      USER_DATA_MUSIC_CHARACTER_HIGHEST_SCORES_FIELD,
      decodeUserMusicCharacterHighestScore,
    ),
    musicDifficulties: decodeRepeated(
      userDataFields,
      USER_DATA_MUSIC_DIFFICULTIES_FIELD,
      decodeUserMusicDifficulty,
    ),
    skillTreePoints: decodeRepeated(
      userDataFields,
      USER_DATA_SKILL_TREE_POINTS_FIELD,
      decodeUserSkillTreePoint,
    ),
  };
}

function decodeRepeated<T>(
  fields: Map<number, ProtoValue[]>,
  field: number,
  decoder: (data: Buffer) => T,
): readonly T[] {
  return (fields.get(field) ?? []).filter(isBuffer).map(decoder);
}

function decodeAccountCard(data: Buffer): AccountCard {
  const fields = decodeProtoFields(data);
  return {
    cardId: requireString(fields, 2, "card ID"),
    exp: uint64(fields, 3),
    levelLimitBreakCount: int32(fields, 4, "card level limit break count"),
    potentialUpgradeCount: int32(fields, 5, "card potential upgrade count"),
    potentialUpgradePointQuantity: int32(
      fields,
      6,
      "card potential upgrade point quantity",
    ),
    acquiredTime: uint64(fields, 7),
  };
}

function decodeUserCharacter(data: Buffer): UserCharacter {
  const fields = decodeProtoFields(data);
  return {
    characterId: requireString(fields, 2, "character ID"),
    costumeId: firstString(fields, 3) ?? "",
    sdCostumeId: firstString(fields, 4) ?? "",
    sdCostumeHairAccessoryId: firstString(fields, 5) ?? "",
    exp: uint64(fields, 6),
    highestLiveDeckEvaluationValue: uint64(fields, 7),
    acquiredTime: uint64(fields, 8),
    lastRewardReceivedLevel: int32(fields, 11, "last reward received level"),
    readTime: uint64(fields, 12),
    parkReadTime: uint64(fields, 13),
    lastWatchedLiveDeckNumber: int32(
      fields,
      14,
      "last watched live deck number",
    ),
  };
}

function decodeUserCharacterSkillTree(data: Buffer): UserCharacterSkillTree {
  const fields = decodeProtoFields(data);
  return {
    characterId: requireString(fields, 2, "skill tree character ID"),
    releasedSkillTreeNodeGroupIds: strings(fields, 3),
    connectedSkillTreeNodeGroupIds: strings(fields, 4),
    connectedSkillTreeNodeCardIds: strings(fields, 5),
  };
}

function decodeUserCostume(data: Buffer): UserCostume {
  const fields = decodeProtoFields(data);
  return {
    costumeId: requireString(fields, 2, "costume ID"),
    acquiredTime: uint64(fields, 3),
    readTime: uint64(fields, 4),
  };
}

function decodeUserItem(data: Buffer): UserItem {
  const fields = decodeProtoFields(data);
  return {
    itemId: requireString(fields, 2, "item ID"),
    expiredTime: uint64(fields, 3),
    quantity: uint64(fields, 4),
    lastAcquiredTime: uint64(fields, 5),
  };
}

function decodeUserLiveDeck(data: Buffer): UserLiveDeck {
  const fields = decodeProtoFields(data);
  return {
    characterId: requireString(fields, 2, "live deck character ID"),
    number: int32(fields, 3, "live deck number"),
    name: firstString(fields, 4) ?? "",
    costumeId: firstString(fields, 5) ?? "",
  };
}

function decodeUserLiveDeckPosition(data: Buffer): UserLiveDeckPosition {
  const fields = decodeProtoFields(data);
  return {
    characterId: requireString(fields, 2, "live deck position character ID"),
    number: int32(fields, 3, "live deck position number"),
    position: int32(fields, 4, "live deck position"),
    cardId: firstString(fields, 5) ?? "",
  };
}

function decodeUserMusic(data: Buffer): UserMusic {
  const fields = decodeProtoFields(data);
  return {
    musicId: requireString(fields, 2, "music ID"),
    isFavorite: firstBool(fields, 3),
    releasedTime: uint64(fields, 8),
    highestScore: uint64(fields, 100),
    highestScoreLastUpdatedTime: uint64(fields, 101),
    highestScoreMusicDifficultyType: int32(
      fields,
      102,
      "highest score music difficulty type",
    ),
    highestScoreCharacterId: firstString(fields, 103) ?? "",
    highestScoreCostumeId: firstString(fields, 104) ?? "",
    highestScoreDeckCardIds: strings(fields, 105),
    highestScoreDeckCardLevels: int32s(fields, 106),
    highestScoreDeckCardPotentialUpgradeCounts: int32s(fields, 107),
    highestScoreDeckCardLiveDeckPowers: uint64s(fields, 108),
    highestScoreDeckCardParametersForCardDetail: uint64s(fields, 109),
    highestScoreDeckCardPerformancesForCardDetail: uint64s(fields, 110),
    highestScoreDeckCardTechniquesForCardDetail: uint64s(fields, 111),
    highestScoreDeckCardSensesForCardDetail: uint64s(fields, 112),
    highestScoreDeckPower: uint64(fields, 113),
    highestScoreDeckEvaluationValue: uint64(fields, 114),
    receivedHighestScoreEvaluationRankRewardRankType: int32(
      fields,
      115,
      "received highest score evaluation rank reward rank type",
    ),
  };
}

function decodeUserMusicCharacterHighestScore(
  data: Buffer,
): UserMusicCharacterHighestScore {
  const fields = decodeProtoFields(data);
  return {
    characterId: requireString(fields, 2, "music score character ID"),
    musicId: requireString(fields, 3, "music score music ID"),
    highestScoreInfos: (fields.get(100) ?? [])
      .filter(isBuffer)
      .map(decodeUserMusicCharacterHighestScoreInfo),
  };
}

function decodeUserMusicCharacterHighestScoreInfo(
  data: Buffer,
): UserMusicCharacterHighestScoreInfo {
  const fields = decodeProtoFields(data);
  return {
    difficultyType: int32(fields, 1, "character score difficulty type"),
    highestScore: uint64(fields, 2),
    highestScoreRatingValue: uint64(fields, 3),
    highestScoreLastUpdatedTime: uint64(fields, 4),
  };
}

function decodeUserMusicDifficulty(data: Buffer): UserMusicDifficulty {
  const fields = decodeProtoFields(data);
  return {
    musicId: requireString(fields, 2, "music difficulty music ID"),
    difficultyType: int32(fields, 3, "music difficulty type"),
    highestScore: uint64(fields, 4),
    nonHighestScoreRatingCharacterHighestScore: uint64(fields, 5),
    nonHighestScoreRatingCharacterHighestScoreCharacterId:
      firstString(fields, 6) ?? "",
    maxComboCount: uint64(fields, 7),
    clearCount: uint64(fields, 8),
    liveResultType: int32(fields, 9, "music live result type"),
    technicalHighestScore: uint64(fields, 1000),
  };
}

function decodeUserSkillTreePoint(data: Buffer): UserSkillTreePoint {
  const fields = decodeProtoFields(data);
  return {
    skillTreePointId: requireString(fields, 2, "skill tree point ID"),
    quantity: uint64(fields, 3),
  };
}

function uint64(fields: Map<number, ProtoValue[]>, field: number): bigint {
  return firstUint(fields, field) ?? 0n;
}

function uint64s(
  fields: Map<number, ProtoValue[]>,
  field: number,
): readonly bigint[] {
  return decodeRepeatedVarints(fields, field);
}

function int32(
  fields: Map<number, ProtoValue[]>,
  field: number,
  name: string,
): number {
  return toSafeNumber(firstUint(fields, field) ?? 0n, name);
}

function int32s(
  fields: Map<number, ProtoValue[]>,
  field: number,
): readonly number[] {
  return decodeRepeatedVarints(fields, field).map((value) =>
    toSafeNumber(value, `protobuf int32 field ${field}`),
  );
}

function strings(
  fields: Map<number, ProtoValue[]>,
  field: number,
): readonly string[] {
  return (fields.get(field) ?? [])
    .filter(isBuffer)
    .map((value) => value.toString("utf8"));
}

function decodeRepeatedVarints(
  fields: Map<number, ProtoValue[]>,
  field: number,
): readonly bigint[] {
  return (fields.get(field) ?? []).flatMap((value) =>
    typeof value === "bigint" ? [value] : decodePackedVarints(value),
  );
}

function decodePackedVarints(data: Buffer): readonly bigint[] {
  const values: bigint[] = [];
  let offset = 0;
  while (offset < data.length) {
    let value = 0n;
    let shift = 0n;
    while (true) {
      if (offset >= data.length || shift > 63n) {
        throw new Error("malformed packed protobuf varint");
      }
      const byte = data[offset++];
      if (byte === undefined)
        throw new Error("malformed packed protobuf varint");
      value |= BigInt(byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) break;
      shift += 7n;
    }
    values.push(value);
  }
  return values;
}
