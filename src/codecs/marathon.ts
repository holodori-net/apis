import {
  firstBool,
  firstInt32,
  firstInt64,
  firstString,
  type ProtoValue,
} from "../protocol/protobuf.js";
import {
  decodeProtoFields,
  encodeMessage,
  encodeStringField,
  isBuffer,
  requireNonEmpty,
} from "./common.js";
import {
  type BasicRankingRankInfo,
  decodeBasicRankingRankInfo,
} from "./ranking.js";
import { type CommonReward, decodeCommonReward } from "./resource.js";

export interface MarathonTopRequest {
  readonly marathonId: string;
}

export interface MarathonTopResponse {
  readonly marathon?: MarathonInfo;
  readonly rankingResult?: MarathonPersonalRankingResult;
}

export interface MarathonInfo {
  readonly id: string;
  readonly startTime: bigint;
  readonly endTime: bigint;
  readonly exchangeEndTime: bigint;
  readonly name: string;
  readonly logoAssetId: string;
  readonly conditionGroupId: string;
  readonly exchangeBoothGroupId: string;
  readonly missionGroupId: string;
  readonly aggregationStartTime: bigint;
  readonly aggregatedRankingRevealStartTime: bigint;
  readonly marathonChapters: readonly MarathonChapter[];
  readonly miniGameScoreBonuses: readonly MarathonMiniGameScoreBonus[];
  readonly liveScoreBonuses: readonly MarathonLiveScoreBonus[];
  readonly musicScoreBonuses: readonly MarathonMusicScoreBonus[];
  readonly miniGameScoreRates: readonly MarathonMiniGameScoreRate[];
  readonly scoreRankingRankRewards: readonly MarathonScoreRankingRankReward[];
  readonly musicHighestScoreRankingRankRewards: readonly MarathonMusicRankingRankReward[];
  readonly totalMusicHighestScoreRankingRewards: readonly MarathonTotalMusicRankingReward[];
  readonly isMarathonScoreRankingDisable: boolean;
  readonly tipsHintType: number;
}

export interface MarathonChapter {
  readonly id: string;
  readonly chapterNumber: number;
  readonly characterId: string;
  readonly endTime: bigint;
  readonly scoreName: string;
  readonly scoreIconAssetId: string;
  readonly marathonEventBadgeItemId: string;
  readonly scoreRankingRankRewardGroupId: string;
  readonly musicHighestScoreRankingRankRewardGroupId: string;
  readonly totalMusicHighestScoreRankingRewardGroupId: string;
  readonly musicScoreBonusGroupId: string;
  readonly miniGameScoreBonusGroupId: string;
  readonly liveScoreBonusGroupId: string;
  readonly miniGameScoreRateGroupId: string;
  readonly missionGroupId: string;
  readonly scoreRewards: readonly MarathonScoreReward[];
  readonly score: bigint;
  readonly eventStoryChapterId: string;
  readonly autoPlayStoryId: string;
  readonly backgroundAssetId: string;
  readonly bgmAssetId: string;
  readonly rankingRevealStartTime: bigint;
}

export interface MarathonScoreReward {
  readonly score: bigint;
  readonly rewards: readonly CommonReward[];
}

export interface MarathonMiniGameScoreBonus {
  readonly groupId: string;
  readonly number: number;
  readonly cardId: string;
  readonly cardRarity: number;
  readonly cardPotentialUpgradeCount: bigint;
  readonly marathonScoreQuantityUpPermilUp: number;
}

export interface MarathonLiveScoreBonus {
  readonly groupId: string;
  readonly number: number;
  readonly characterId: string;
  readonly cardId: string;
  readonly cardAttributeType: number;
  readonly cardRarity: number;
  readonly cardPotentialUpgradeCount: bigint;
  readonly marathonScoreQuantityUpPermilUp: number;
}

export interface MarathonMusicScoreBonus {
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

export interface MarathonMiniGameScoreRate {
  readonly groupId: string;
  readonly miniGameType: number;
  readonly marathonScorePermilMultiply: number;
  readonly bonusPermilUp: number;
}

export interface MarathonScoreRankingRankReward {
  readonly groupId: string;
  readonly endRank: bigint;
  readonly rewards: readonly CommonReward[];
  readonly marathonRankingGradeId: string;
}

export interface MarathonMusicRankingRankReward extends MarathonScoreRankingRankReward {
  readonly musicId: string;
}

export type MarathonTotalMusicRankingReward = MarathonScoreRankingRankReward;

export interface MarathonPersonalRankingResult {
  readonly marathonChapters: readonly MarathonPersonalChapterRankingResult[];
}

export interface MarathonPersonalChapterRankingResult {
  readonly marathonChapterId: string;
  readonly marathonScoreRank: bigint;
  readonly marathonScoreRankingRewards: readonly CommonReward[];
  readonly musicHighestScoreRankingRankResults: readonly MarathonMusicPersonalRankingResult[];
  readonly totalMusicHighestScoreRank: bigint;
  readonly totalMusicHighestScoreRankingRewards: readonly CommonReward[];
}

export interface MarathonMusicPersonalRankingResult {
  readonly musicId: string;
  readonly rank: bigint;
  readonly rewards: readonly CommonReward[];
}

export interface MarathonListMusicHighestScoreRankingRequest {
  readonly marathonChapterId: string;
  readonly musicId: string;
}

export interface MarathonListRankingRequest {
  readonly marathonChapterId: string;
}

export interface MarathonMusicRankingResponse {
  readonly rankingResult?: MarathonRankingResult;
}

export interface MarathonScoreRankingResponse {
  readonly result?: MarathonRankingResult;
}

export interface MarathonRankingResult {
  readonly selfRank: number;
  readonly selfScore: bigint;
  readonly isSelfRankOutOfRange: boolean;
  readonly rankInfos: readonly BasicRankingRankInfo[];
}

export function encodeMarathonTopRequest(request: MarathonTopRequest): Buffer {
  return encodeMessage(
    encodeStringField(1, requireNonEmpty(request.marathonId, "Marathon ID")),
  );
}

export function encodeMarathonListMusicHighestScoreRankingRequest(
  request: MarathonListMusicHighestScoreRankingRequest,
): Buffer {
  return encodeMessage(
    encodeStringField(
      1,
      requireNonEmpty(request.marathonChapterId, "Marathon chapter ID"),
    ),
    encodeStringField(2, requireNonEmpty(request.musicId, "music ID")),
  );
}

export function encodeMarathonListRankingRequest(
  request: MarathonListRankingRequest,
): Buffer {
  return encodeMessage(
    encodeStringField(
      1,
      requireNonEmpty(request.marathonChapterId, "Marathon chapter ID"),
    ),
  );
}

export function decodeMarathonTopResponse(data: Buffer): MarathonTopResponse {
  const fields = decodeProtoFields(data);
  const marathon = firstMessage(fields, 1);
  const rankingResult = firstMessage(fields, 2);
  return {
    ...(marathon === undefined
      ? {}
      : { marathon: decodeMarathonInfo(marathon) }),
    ...(rankingResult === undefined
      ? {}
      : { rankingResult: decodeMarathonPersonalRankingResult(rankingResult) }),
  };
}

export function decodeMarathonMusicRankingResponse(
  data: Buffer,
): MarathonMusicRankingResponse {
  const fields = decodeProtoFields(data);
  const rankingResult = firstMessage(fields, 1);
  return {
    ...(rankingResult === undefined
      ? {}
      : { rankingResult: decodeMarathonRankingResult(rankingResult) }),
  };
}

export function decodeMarathonScoreRankingResponse(
  data: Buffer,
): MarathonScoreRankingResponse {
  const fields = decodeProtoFields(data);
  const result = firstMessage(fields, 1);
  return {
    ...(result === undefined
      ? {}
      : { result: decodeMarathonRankingResult(result) }),
  };
}

function decodeMarathonInfo(data: Buffer): MarathonInfo {
  const fields = decodeProtoFields(data);
  return {
    id: firstString(fields, 1) ?? "",
    startTime: firstInt64(fields, 2) ?? 0n,
    endTime: firstInt64(fields, 3) ?? 0n,
    exchangeEndTime: firstInt64(fields, 4) ?? 0n,
    name: firstString(fields, 5) ?? "",
    logoAssetId: firstString(fields, 6) ?? "",
    conditionGroupId: firstString(fields, 7) ?? "",
    exchangeBoothGroupId: firstString(fields, 8) ?? "",
    missionGroupId: firstString(fields, 9) ?? "",
    aggregationStartTime: firstInt64(fields, 10) ?? 0n,
    aggregatedRankingRevealStartTime: firstInt64(fields, 11) ?? 0n,
    marathonChapters: decodeRepeated(fields, 12, decodeMarathonChapter),
    miniGameScoreBonuses: decodeRepeated(fields, 13, decodeMiniGameScoreBonus),
    liveScoreBonuses: decodeRepeated(fields, 14, decodeLiveScoreBonus),
    musicScoreBonuses: decodeRepeated(fields, 15, decodeMusicScoreBonus),
    miniGameScoreRates: decodeRepeated(fields, 16, decodeMiniGameScoreRate),
    scoreRankingRankRewards: decodeRepeated(fields, 17, decodeScoreRankReward),
    musicHighestScoreRankingRankRewards: decodeRepeated(
      fields,
      18,
      decodeMusicRankReward,
    ),
    totalMusicHighestScoreRankingRewards: decodeRepeated(
      fields,
      19,
      decodeScoreRankReward,
    ),
    isMarathonScoreRankingDisable: firstBool(fields, 20),
    tipsHintType: numberField(fields, 21),
  };
}

function decodeMarathonChapter(data: Buffer): MarathonChapter {
  const fields = decodeProtoFields(data);
  return {
    id: firstString(fields, 1) ?? "",
    chapterNumber: numberField(fields, 2),
    characterId: firstString(fields, 3) ?? "",
    endTime: firstInt64(fields, 4) ?? 0n,
    scoreName: firstString(fields, 5) ?? "",
    scoreIconAssetId: firstString(fields, 6) ?? "",
    marathonEventBadgeItemId: firstString(fields, 7) ?? "",
    scoreRankingRankRewardGroupId: firstString(fields, 8) ?? "",
    musicHighestScoreRankingRankRewardGroupId: firstString(fields, 9) ?? "",
    totalMusicHighestScoreRankingRewardGroupId: firstString(fields, 10) ?? "",
    musicScoreBonusGroupId: firstString(fields, 11) ?? "",
    miniGameScoreBonusGroupId: firstString(fields, 12) ?? "",
    liveScoreBonusGroupId: firstString(fields, 13) ?? "",
    miniGameScoreRateGroupId: firstString(fields, 14) ?? "",
    missionGroupId: firstString(fields, 15) ?? "",
    scoreRewards: decodeRepeated(fields, 16, decodeScoreReward),
    score: firstInt64(fields, 17) ?? 0n,
    eventStoryChapterId: firstString(fields, 18) ?? "",
    autoPlayStoryId: firstString(fields, 19) ?? "",
    backgroundAssetId: firstString(fields, 20) ?? "",
    bgmAssetId: firstString(fields, 21) ?? "",
    rankingRevealStartTime: firstInt64(fields, 22) ?? 0n,
  };
}

function decodeScoreReward(data: Buffer): MarathonScoreReward {
  const fields = decodeProtoFields(data);
  return {
    score: firstInt64(fields, 1) ?? 0n,
    rewards: decodeRepeated(fields, 2, decodeCommonReward),
  };
}

function decodeMiniGameScoreBonus(data: Buffer): MarathonMiniGameScoreBonus {
  const fields = decodeProtoFields(data);
  return {
    groupId: firstString(fields, 1) ?? "",
    number: numberField(fields, 2),
    cardId: firstString(fields, 3) ?? "",
    cardRarity: numberField(fields, 4),
    cardPotentialUpgradeCount: firstInt64(fields, 5) ?? 0n,
    marathonScoreQuantityUpPermilUp: numberField(fields, 6),
  };
}

function decodeLiveScoreBonus(data: Buffer): MarathonLiveScoreBonus {
  const fields = decodeProtoFields(data);
  return {
    groupId: firstString(fields, 1) ?? "",
    number: numberField(fields, 2),
    characterId: firstString(fields, 3) ?? "",
    cardId: firstString(fields, 4) ?? "",
    cardAttributeType: numberField(fields, 5),
    cardRarity: numberField(fields, 6),
    cardPotentialUpgradeCount: firstInt64(fields, 7) ?? 0n,
    marathonScoreQuantityUpPermilUp: numberField(fields, 8),
  };
}

function decodeMusicScoreBonus(data: Buffer): MarathonMusicScoreBonus {
  const fields = decodeProtoFields(data);
  return {
    groupId: firstString(fields, 1) ?? "",
    musicId: firstString(fields, 2) ?? "",
    number: numberField(fields, 3),
    characterId: firstString(fields, 4) ?? "",
    cardId: firstString(fields, 5) ?? "",
    cardAttributeType: numberField(fields, 6),
    cardRarity: numberField(fields, 7),
    cardPotentialUpgradeCount: firstInt64(fields, 8) ?? 0n,
    scoreUpPermilUp: numberField(fields, 9),
  };
}

function decodeMiniGameScoreRate(data: Buffer): MarathonMiniGameScoreRate {
  const fields = decodeProtoFields(data);
  return {
    groupId: firstString(fields, 1) ?? "",
    miniGameType: numberField(fields, 2),
    marathonScorePermilMultiply: numberField(fields, 3),
    bonusPermilUp: numberField(fields, 4),
  };
}

function decodeScoreRankReward(data: Buffer): MarathonScoreRankingRankReward {
  const fields = decodeProtoFields(data);
  return {
    groupId: firstString(fields, 1) ?? "",
    endRank: firstInt64(fields, 2) ?? 0n,
    rewards: decodeRepeated(fields, 3, decodeCommonReward),
    marathonRankingGradeId: firstString(fields, 4) ?? "",
  };
}

function decodeMusicRankReward(data: Buffer): MarathonMusicRankingRankReward {
  const fields = decodeProtoFields(data);
  return {
    groupId: firstString(fields, 1) ?? "",
    musicId: firstString(fields, 2) ?? "",
    endRank: firstInt64(fields, 3) ?? 0n,
    rewards: decodeRepeated(fields, 4, decodeCommonReward),
    marathonRankingGradeId: firstString(fields, 5) ?? "",
  };
}

function decodeMarathonPersonalRankingResult(
  data: Buffer,
): MarathonPersonalRankingResult {
  const fields = decodeProtoFields(data);
  return {
    marathonChapters: decodeRepeated(fields, 1, decodePersonalChapterResult),
  };
}

function decodePersonalChapterResult(
  data: Buffer,
): MarathonPersonalChapterRankingResult {
  const fields = decodeProtoFields(data);
  return {
    marathonChapterId: firstString(fields, 1) ?? "",
    marathonScoreRank: firstInt64(fields, 2) ?? 0n,
    marathonScoreRankingRewards: decodeRepeated(fields, 3, decodeCommonReward),
    musicHighestScoreRankingRankResults: decodeRepeated(
      fields,
      4,
      decodeMusicPersonalResult,
    ),
    totalMusicHighestScoreRank: firstInt64(fields, 5) ?? 0n,
    totalMusicHighestScoreRankingRewards: decodeRepeated(
      fields,
      6,
      decodeCommonReward,
    ),
  };
}

function decodeMusicPersonalResult(
  data: Buffer,
): MarathonMusicPersonalRankingResult {
  const fields = decodeProtoFields(data);
  return {
    musicId: firstString(fields, 1) ?? "",
    rank: firstInt64(fields, 2) ?? 0n,
    rewards: decodeRepeated(fields, 3, decodeCommonReward),
  };
}

function decodeMarathonRankingResult(data: Buffer): MarathonRankingResult {
  const fields = decodeProtoFields(data);
  return {
    selfRank: numberField(fields, 1),
    selfScore: firstInt64(fields, 2) ?? 0n,
    isSelfRankOutOfRange: firstBool(fields, 3),
    rankInfos: decodeRepeated(fields, 4, decodeBasicRankingRankInfo),
  };
}

function decodeRepeated<T>(
  fields: Map<number, ProtoValue[]>,
  field: number,
  decode: (data: Buffer) => T,
): T[] {
  return (fields.get(field) ?? []).filter(isBuffer).map(decode);
}

function firstMessage(
  fields: Map<number, ProtoValue[]>,
  field: number,
): Buffer | undefined {
  return fields.get(field)?.find(isBuffer);
}

function numberField(fields: Map<number, ProtoValue[]>, field: number): number {
  return firstInt32(fields, field) ?? 0;
}
