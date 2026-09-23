import { firstBool, firstString, firstUint } from "../protobuf.js";
import {
  decodeProtoFields,
  encodeEmpty,
  isBuffer,
  toSafeNumber,
} from "./common.js";

export interface EventListEventInfoResponse {
  readonly eventInfos: readonly EventInfo[];
}

export interface EventListEventInfoForPortalResponse {
  readonly eventInfos: readonly EventPortalInfo[];
}

export interface EventInfo extends EventPortalInfo {
  readonly marathonInfo?: EventMarathonInfo;
}

export interface EventPortalInfo {
  readonly eventId: string;
  readonly type: number;
  readonly name: string;
  readonly startTime: bigint;
  readonly endTime: bigint;
  readonly exchangeEndTime: bigint;
  readonly logoAssetId: string;
  readonly backgroundAssetId: string;
  readonly isNew: boolean;
  readonly isNoti: boolean;
  readonly missionGroupId: string;
  readonly viewConditionGroupId: string;
  readonly unlockConditionGroupId: string;
}

export interface EventMarathonInfo {
  readonly exchangeBoothGroupId: string;
  readonly aggregationStartTime: bigint;
  readonly aggregatedRankingRevealStartTime: bigint;
  readonly marathonChapters: readonly EventMarathonChapter[];
  readonly isMarathonScoreRankingDisable: boolean;
  readonly tipsHintType: number;
}

export interface EventMarathonChapter {
  readonly id: string;
  readonly chapterNumber: number;
  readonly characterId: string;
  readonly endTime: bigint;
  readonly scoreName: string;
  readonly scoreIconAssetId: string;
  readonly marathonEventBadgeItemId: string;
  readonly missionGroupId: string;
  readonly marathonScoreRewards: readonly EventMarathonScoreReward[];
  readonly score: bigint;
  readonly eventStoryChapterId: string;
  readonly autoPlayStoryId: string;
  readonly backgroundAssetId: string;
  readonly bgmAssetId: string;
  readonly rankingRevealStartTime: bigint;
  readonly marathonScoreRankingRankRewards: readonly EventRankReward[];
  readonly marathonMusicHighestScoreRankingRankRewards: readonly EventMusicRankReward[];
  readonly marathonTotalMusicHighestScoreRankingRewards: readonly EventRankReward[];
  readonly marathonMusicScoreBonuses: readonly EventMusicScoreBonus[];
  readonly marathonMiniGameMarathonScoreBonuses: readonly EventMiniGameScoreBonus[];
  readonly marathonLiveMarathonScoreBonuses: readonly EventLiveScoreBonus[];
  readonly marathonMiniGameScoreRates: readonly EventMiniGameScoreRate[];
}

export interface EventReward {
  readonly resourceType: number;
  readonly resourceId: string;
  readonly quantity: bigint;
}

export interface EventMarathonScoreReward {
  readonly score: bigint;
  readonly rewards: readonly EventReward[];
}

export interface EventRankReward {
  readonly groupId: string;
  readonly endRank: bigint;
  readonly rewards: readonly EventReward[];
  readonly marathonRankingGradeId: string;
}

export interface EventMusicRankReward extends EventRankReward {
  readonly musicId: string;
}

export interface EventMusicScoreBonus {
  readonly groupId: string;
  readonly musicId: string;
  readonly number: number;
  readonly characterId: string;
  readonly cardId: string;
  readonly cardAttributeType: number;
  readonly cardRarity: number;
  readonly cardPotentialUpgradeCount: bigint;
  readonly scoreUpPermilUp: number;
}

export interface EventMiniGameScoreBonus {
  readonly groupId: string;
  readonly number: number;
  readonly cardId: string;
  readonly cardRarity: number;
  readonly cardPotentialUpgradeCount: bigint;
  readonly marathonScoreQuantityUpPermilUp: number;
}

export interface EventLiveScoreBonus {
  readonly groupId: string;
  readonly number: number;
  readonly characterId: string;
  readonly cardId: string;
  readonly cardAttributeType: number;
  readonly cardRarity: number;
  readonly cardPotentialUpgradeCount: bigint;
  readonly marathonScoreQuantityUpPermilUp: number;
}

export interface EventMiniGameScoreRate {
  readonly groupId: string;
  readonly miniGameType: number;
  readonly marathonScorePermilMultiply: number;
  readonly bonusPermilUp: number;
}

export function encodeEventListEventInfoRequest(): Buffer {
  return encodeEmpty();
}

export function encodeEventListEventInfoForPortalRequest(): Buffer {
  return encodeEmpty();
}

export function decodeEventListEventInfoResponse(
  data: Buffer,
): EventListEventInfoResponse {
  const fields = decodeProtoFields(data);
  return {
    eventInfos: (fields.get(1) ?? []).filter(isBuffer).map(decodeEventInfo),
  };
}

export function decodeEventListEventInfoForPortalResponse(
  data: Buffer,
): EventListEventInfoForPortalResponse {
  const fields = decodeProtoFields(data);
  return {
    eventInfos: (fields.get(1) ?? []).filter(isBuffer).map(decodePortalInfo),
  };
}

function decodeEventInfo(data: Buffer): EventInfo {
  const fields = decodeProtoFields(data);
  const marathonInfo = (fields.get(14) ?? []).find(isBuffer);
  return {
    ...decodePortalInfoFields(fields),
    ...(marathonInfo === undefined
      ? {}
      : { marathonInfo: decodeMarathonInfo(marathonInfo) }),
  };
}

function decodePortalInfo(data: Buffer): EventPortalInfo {
  return decodePortalInfoFields(decodeProtoFields(data));
}

function decodePortalInfoFields(
  fields: ReturnType<typeof decodeProtoFields>,
): EventPortalInfo {
  return {
    eventId: firstString(fields, 1) ?? "",
    type: numberField(fields, 2, "event type"),
    name: firstString(fields, 3) ?? "",
    startTime: firstUint(fields, 4) ?? 0n,
    endTime: firstUint(fields, 5) ?? 0n,
    exchangeEndTime: firstUint(fields, 6) ?? 0n,
    logoAssetId: firstString(fields, 7) ?? "",
    backgroundAssetId: firstString(fields, 8) ?? "",
    isNew: firstBool(fields, 9),
    isNoti: firstBool(fields, 10),
    missionGroupId: firstString(fields, 11) ?? "",
    viewConditionGroupId: firstString(fields, 12) ?? "",
    unlockConditionGroupId: firstString(fields, 13) ?? "",
  };
}

function decodeMarathonInfo(data: Buffer): EventMarathonInfo {
  const fields = decodeProtoFields(data);
  return {
    exchangeBoothGroupId: firstString(fields, 1) ?? "",
    aggregationStartTime: firstUint(fields, 2) ?? 0n,
    aggregatedRankingRevealStartTime: firstUint(fields, 3) ?? 0n,
    marathonChapters: (fields.get(4) ?? [])
      .filter(isBuffer)
      .map(decodeMarathonChapter),
    isMarathonScoreRankingDisable: firstBool(fields, 5),
    tipsHintType: numberField(fields, 6, "tips hint type"),
  };
}

function decodeMarathonChapter(data: Buffer): EventMarathonChapter {
  const fields = decodeProtoFields(data);
  return {
    id: firstString(fields, 1) ?? "",
    chapterNumber: numberField(fields, 2, "marathon chapter number"),
    characterId: firstString(fields, 3) ?? "",
    endTime: firstUint(fields, 4) ?? 0n,
    scoreName: firstString(fields, 5) ?? "",
    scoreIconAssetId: firstString(fields, 6) ?? "",
    marathonEventBadgeItemId: firstString(fields, 7) ?? "",
    missionGroupId: firstString(fields, 8) ?? "",
    marathonScoreRewards: decodeRepeatedMessage(fields, 9, decodeScoreReward),
    score: firstUint(fields, 10) ?? 0n,
    eventStoryChapterId: firstString(fields, 11) ?? "",
    autoPlayStoryId: firstString(fields, 12) ?? "",
    backgroundAssetId: firstString(fields, 13) ?? "",
    bgmAssetId: firstString(fields, 14) ?? "",
    rankingRevealStartTime: firstUint(fields, 15) ?? 0n,
    marathonScoreRankingRankRewards: decodeRepeatedMessage(
      fields,
      16,
      decodeRankReward,
    ),
    marathonMusicHighestScoreRankingRankRewards: decodeRepeatedMessage(
      fields,
      17,
      decodeMusicRankReward,
    ),
    marathonTotalMusicHighestScoreRankingRewards: decodeRepeatedMessage(
      fields,
      18,
      decodeRankReward,
    ),
    marathonMusicScoreBonuses: decodeRepeatedMessage(
      fields,
      19,
      decodeMusicScoreBonus,
    ),
    marathonMiniGameMarathonScoreBonuses: decodeRepeatedMessage(
      fields,
      20,
      decodeMiniGameScoreBonus,
    ),
    marathonLiveMarathonScoreBonuses: decodeRepeatedMessage(
      fields,
      21,
      decodeLiveScoreBonus,
    ),
    marathonMiniGameScoreRates: decodeRepeatedMessage(
      fields,
      22,
      decodeMiniGameScoreRate,
    ),
  };
}

function decodeScoreReward(data: Buffer): EventMarathonScoreReward {
  const fields = decodeProtoFields(data);
  return {
    score: firstUint(fields, 1) ?? 0n,
    rewards: decodeRepeatedMessage(fields, 2, decodeReward),
  };
}

function decodeRankReward(data: Buffer): EventRankReward {
  const fields = decodeProtoFields(data);
  return {
    groupId: firstString(fields, 1) ?? "",
    endRank: firstUint(fields, 2) ?? 0n,
    rewards: decodeRepeatedMessage(fields, 3, decodeReward),
    marathonRankingGradeId: firstString(fields, 4) ?? "",
  };
}

function decodeMusicRankReward(data: Buffer): EventMusicRankReward {
  const fields = decodeProtoFields(data);
  return {
    groupId: firstString(fields, 1) ?? "",
    musicId: firstString(fields, 2) ?? "",
    endRank: firstUint(fields, 3) ?? 0n,
    rewards: decodeRepeatedMessage(fields, 4, decodeReward),
    marathonRankingGradeId: firstString(fields, 5) ?? "",
  };
}

function decodeReward(data: Buffer): EventReward {
  const fields = decodeProtoFields(data);
  return {
    resourceType: numberField(fields, 1, "reward resource type"),
    resourceId: firstString(fields, 2) ?? "",
    quantity: firstUint(fields, 3) ?? 0n,
  };
}

function decodeMusicScoreBonus(data: Buffer): EventMusicScoreBonus {
  const fields = decodeProtoFields(data);
  return {
    groupId: firstString(fields, 1) ?? "",
    musicId: firstString(fields, 2) ?? "",
    number: numberField(fields, 3, "music bonus number"),
    characterId: firstString(fields, 4) ?? "",
    cardId: firstString(fields, 5) ?? "",
    cardAttributeType: numberField(fields, 6, "card attribute type"),
    cardRarity: numberField(fields, 7, "card rarity"),
    cardPotentialUpgradeCount: firstUint(fields, 8) ?? 0n,
    scoreUpPermilUp: numberField(fields, 9, "score up permil"),
  };
}

function decodeMiniGameScoreBonus(data: Buffer): EventMiniGameScoreBonus {
  const fields = decodeProtoFields(data);
  return {
    groupId: firstString(fields, 1) ?? "",
    number: numberField(fields, 2, "minigame bonus number"),
    cardId: firstString(fields, 3) ?? "",
    cardRarity: numberField(fields, 4, "card rarity"),
    cardPotentialUpgradeCount: firstUint(fields, 5) ?? 0n,
    marathonScoreQuantityUpPermilUp: numberField(
      fields,
      6,
      "marathon score quantity up permil",
    ),
  };
}

function decodeLiveScoreBonus(data: Buffer): EventLiveScoreBonus {
  const fields = decodeProtoFields(data);
  return {
    groupId: firstString(fields, 1) ?? "",
    number: numberField(fields, 2, "live bonus number"),
    characterId: firstString(fields, 3) ?? "",
    cardId: firstString(fields, 4) ?? "",
    cardAttributeType: numberField(fields, 5, "card attribute type"),
    cardRarity: numberField(fields, 6, "card rarity"),
    cardPotentialUpgradeCount: firstUint(fields, 7) ?? 0n,
    marathonScoreQuantityUpPermilUp: numberField(
      fields,
      8,
      "marathon score quantity up permil",
    ),
  };
}

function decodeMiniGameScoreRate(data: Buffer): EventMiniGameScoreRate {
  const fields = decodeProtoFields(data);
  return {
    groupId: firstString(fields, 1) ?? "",
    miniGameType: numberField(fields, 2, "minigame type"),
    marathonScorePermilMultiply: numberField(
      fields,
      3,
      "marathon score permil multiplier",
    ),
    bonusPermilUp: numberField(fields, 4, "bonus permil increase"),
  };
}

function decodeRepeatedMessage<T>(
  fields: ReturnType<typeof decodeProtoFields>,
  field: number,
  decode: (data: Buffer) => T,
): readonly T[] {
  return (fields.get(field) ?? []).filter(isBuffer).map(decode);
}

function numberField(
  fields: ReturnType<typeof decodeProtoFields>,
  field: number,
  name: string,
): number {
  return toSafeNumber(firstUint(fields, field) ?? 0n, name);
}
