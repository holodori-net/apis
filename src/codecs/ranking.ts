import {
  firstInt32,
  firstInt64,
  firstString,
  type ProtoValue,
} from "../protobuf.js";
import { decodeProtoFields, isBuffer } from "./common.js";
import {
  decodeProfileBasicUserInfo,
  type ProfileBasicUserInfo,
} from "./profile.js";

export interface BasicRankingRankInfo {
  readonly rank: number;
  readonly score: bigint;
  readonly userInfo?: ProfileBasicUserInfo;
}

export interface RankingLiveDeckCard {
  readonly position: number;
  readonly cardId: string;
  readonly level: number;
  readonly potentialUpgradeCount: number;
  readonly liveDeckPower: bigint;
  readonly parameterForCardDetail: bigint;
  readonly performanceForCardDetail: bigint;
  readonly techniqueForCardDetail: bigint;
  readonly senseForCardDetail: bigint;
}

export interface RankingLiveDeckInfo {
  readonly characterId: string;
  readonly costumeId: string;
  readonly deckCards: readonly RankingLiveDeckCard[];
  readonly deckPower: bigint;
  readonly deckEvaluationValue: bigint;
}

export function decodeBasicRankingRankInfo(data: Buffer): BasicRankingRankInfo {
  const fields = decodeProtoFields(data);
  const userInfo = firstMessage(fields, 3);
  return {
    rank: firstInt32(fields, 1) ?? 0,
    score: firstInt64(fields, 2) ?? 0n,
    ...(userInfo === undefined
      ? {}
      : { userInfo: decodeProfileBasicUserInfo(userInfo) }),
  };
}

export function decodeRankingLiveDeckInfo(data: Buffer): RankingLiveDeckInfo {
  const fields = decodeProtoFields(data);
  return {
    characterId: firstString(fields, 1) ?? "",
    costumeId: firstString(fields, 2) ?? "",
    deckCards: decodeRepeated(fields, 3, decodeRankingLiveDeckCard),
    deckPower: firstInt64(fields, 4) ?? 0n,
    deckEvaluationValue: firstInt64(fields, 5) ?? 0n,
  };
}

function decodeRankingLiveDeckCard(data: Buffer): RankingLiveDeckCard {
  const fields = decodeProtoFields(data);
  return {
    position: firstInt32(fields, 1) ?? 0,
    cardId: firstString(fields, 2) ?? "",
    level: firstInt32(fields, 3) ?? 0,
    potentialUpgradeCount: firstInt32(fields, 4) ?? 0,
    liveDeckPower: firstInt64(fields, 5) ?? 0n,
    parameterForCardDetail: firstInt64(fields, 6) ?? 0n,
    performanceForCardDetail: firstInt64(fields, 7) ?? 0n,
    techniqueForCardDetail: firstInt64(fields, 8) ?? 0n,
    senseForCardDetail: firstInt64(fields, 9) ?? 0n,
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
  const value = fields.get(field)?.[0];
  return Buffer.isBuffer(value) ? value : undefined;
}
