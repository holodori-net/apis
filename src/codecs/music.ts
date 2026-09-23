import {
  firstBytes,
  firstInt32,
  firstInt64,
  firstString,
  firstUint,
  type ProtoValue,
} from "../protobuf.js";
import {
  decodeProtoFields,
  decodeRepeatedMessages,
  encodeMessage,
  encodeStringField,
  requireNonEmpty,
  toSafeNumber,
} from "./common.js";
import {
  type BasicRankingRankInfo,
  decodeBasicRankingRankInfo,
  decodeRankingLiveDeckInfo,
  type RankingLiveDeckInfo,
} from "./ranking.js";

export interface MusicGetHighestScoreLiveDeckRequest {
  readonly publicUserId: string;
  readonly musicId: string;
}

export interface MusicGetHighestScoreLiveDeckResponse {
  readonly rankingLiveDeckInfo?: RankingLiveDeckInfo;
}

export interface MusicGetHighestScoreRankingInfoRequest {
  readonly musicId: string;
}

export interface MusicDifficultyScoreInfo {
  readonly musicDifficultyType: number;
  readonly score: bigint;
}

export interface MusicGetHighestScoreRankingInfoResponse {
  readonly selfRank: number;
  readonly rankInfos: readonly BasicRankingRankInfo[];
  readonly selfMusicDifficultyScoreInfos: readonly MusicDifficultyScoreInfo[];
}

export interface MusicListHighestScoreRatingRankingRankRequest {
  readonly characterIds: readonly string[];
}

export interface MusicHighestScoreRatingRankingRankInfo {
  readonly rank: number;
  readonly characterId: string;
}

export interface MusicListHighestScoreRatingRankingRankResponse {
  readonly rankInfos: readonly MusicHighestScoreRatingRankingRankInfo[];
}

export interface MusicGetHighestScoreRatingRankingInfoRequest {
  readonly characterId: string;
}

export interface MusicGetHighestScoreRatingRankingInfoResponse {
  readonly rankInfos: readonly BasicRankingRankInfo[];
}

export interface MusicListHighestScoreRatingRankingRewardThresholdRankingRankInfoRequest {
  readonly characterId: string;
}

export interface MusicThresholdRankingRankInfo {
  readonly rank: number;
  readonly score: bigint;
}

export interface MusicListHighestScoreRatingRankingRewardThresholdRankingRankInfoResponse {
  readonly thresholdRankInfos: readonly MusicThresholdRankingRankInfo[];
  readonly updatedRankingTime: bigint;
}

export function encodeMusicGetHighestScoreLiveDeckRequest(
  request: MusicGetHighestScoreLiveDeckRequest,
): Buffer {
  return encodeMessage(
    encodeStringField(
      1,
      requireNonEmpty(request.publicUserId, "public user ID"),
    ),
    encodeStringField(2, requireNonEmpty(request.musicId, "music ID")),
  );
}

export function encodeMusicGetHighestScoreRankingInfoRequest(
  request: MusicGetHighestScoreRankingInfoRequest,
): Buffer {
  return encodeMessage(
    encodeStringField(1, requireNonEmpty(request.musicId, "music ID")),
  );
}

export function encodeMusicListHighestScoreRatingRankingRankRequest(
  request: MusicListHighestScoreRatingRankingRankRequest,
): Buffer {
  validateUniqueNonEmpty(request.characterIds, "character IDs");
  return encodeMessage(
    ...request.characterIds.map((id) => encodeStringField(1, id)),
  );
}

export function encodeMusicGetHighestScoreRatingRankingInfoRequest(
  request: MusicGetHighestScoreRatingRankingInfoRequest,
): Buffer {
  return encodeMessage(
    encodeStringField(1, requireNonEmpty(request.characterId, "character ID")),
  );
}

export function encodeMusicListHighestScoreRatingRankingRewardThresholdRankingRankInfoRequest(
  request: MusicListHighestScoreRatingRankingRewardThresholdRankingRankInfoRequest,
): Buffer {
  return encodeMusicGetHighestScoreRatingRankingInfoRequest(request);
}

export function decodeMusicGetHighestScoreLiveDeckResponse(
  data: Buffer,
): MusicGetHighestScoreLiveDeckResponse {
  const fields = decodeProtoFields(data);
  const deck = firstBytes(fields, 1);
  return deck === undefined
    ? {}
    : { rankingLiveDeckInfo: decodeRankingLiveDeckInfo(deck) };
}

export function decodeMusicGetHighestScoreRankingInfoResponse(
  data: Buffer,
): MusicGetHighestScoreRankingInfoResponse {
  const fields = decodeProtoFields(data);
  return {
    selfRank: firstInt32(fields, 1) ?? 0,
    rankInfos: decodeRepeatedMessages(fields, 2, decodeBasicRankingRankInfo),
    selfMusicDifficultyScoreInfos: decodeRepeatedMessages(
      fields,
      3,
      decodeMusicDifficultyScoreInfo,
    ),
  };
}

export function decodeMusicListHighestScoreRatingRankingRankResponse(
  data: Buffer,
): MusicListHighestScoreRatingRankingRankResponse {
  const fields = decodeProtoFields(data);
  return {
    rankInfos: decodeRepeatedMessages(
      fields,
      1,
      decodeMusicHighestScoreRatingRankingRankInfo,
    ),
  };
}

export function decodeMusicGetHighestScoreRatingRankingInfoResponse(
  data: Buffer,
): MusicGetHighestScoreRatingRankingInfoResponse {
  const fields = decodeProtoFields(data);
  return {
    rankInfos: decodeRepeatedMessages(fields, 1, decodeBasicRankingRankInfo),
  };
}

export function decodeMusicListHighestScoreRatingRankingRewardThresholdRankingRankInfoResponse(
  data: Buffer,
): MusicListHighestScoreRatingRankingRewardThresholdRankingRankInfoResponse {
  const fields = decodeProtoFields(data);
  return {
    thresholdRankInfos: decodeRepeatedMessages(
      fields,
      1,
      decodeMusicThresholdRankingRankInfo,
    ),
    updatedRankingTime: firstInt64(fields, 2) ?? 0n,
  };
}

function decodeMusicDifficultyScoreInfo(
  data: Buffer,
): MusicDifficultyScoreInfo {
  const fields = decodeProtoFields(data);
  return {
    musicDifficultyType: readNumber(fields, 1),
    score: firstInt64(fields, 2) ?? 0n,
  };
}

function decodeMusicHighestScoreRatingRankingRankInfo(
  data: Buffer,
): MusicHighestScoreRatingRankingRankInfo {
  const fields = decodeProtoFields(data);
  return {
    rank: firstInt32(fields, 1) ?? 0,
    characterId: firstString(fields, 2) ?? "",
  };
}

function decodeMusicThresholdRankingRankInfo(
  data: Buffer,
): MusicThresholdRankingRankInfo {
  const fields = decodeProtoFields(data);
  return {
    rank: firstInt32(fields, 1) ?? 0,
    score: firstInt64(fields, 2) ?? 0n,
  };
}

function readNumber(fields: Map<number, ProtoValue[]>, field: number): number {
  return toSafeNumber(firstUint(fields, field) ?? 0n, `music field ${field}`);
}

function validateUniqueNonEmpty(values: readonly string[], name: string): void {
  if (values.length === 0) throw new RangeError(`${name} must not be empty`);
  const seen = new Set<string>();
  for (const value of values) {
    requireNonEmpty(value, name);
    if (seen.has(value)) throw new RangeError(`${name} must be unique`);
    seen.add(value);
  }
}
