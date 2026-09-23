import { encodeVarintField, firstInt32, type ProtoValue } from "../protobuf.js";
import { decodeProtoFields, encodeMessage, isBuffer } from "./common.js";
import {
  type BasicRankingRankInfo,
  decodeBasicRankingRankInfo,
} from "./ranking.js";

/** Team category used to select the Chase leaderboard. */
export enum ChaseTeamType {
  Mischief = 1,
  Patrol = 2,
}

/** Ranking state returned by a mini-game leaderboard. */
export interface MiniGameRankingResponse {
  /** Rank of the authenticated account, or zero when it has no rank. */
  readonly selfRank: number;
  readonly rankInfos: readonly BasicRankingRankInfo[];
}

/** Encodes the empty protobuf request used by mini-game ranking RPCs. */
export function encodeMiniGameRankingRequest(): Buffer {
  return Buffer.alloc(0);
}

/** Encodes the Chase ranking request. */
export function encodeChaseRankingRequest(
  request: ChaseRankingRequest,
): Buffer {
  if (
    request.chaseTeamType !== ChaseTeamType.Mischief &&
    request.chaseTeamType !== ChaseTeamType.Patrol
  ) {
    throw new RangeError("chaseTeamType must be Mischief or Patrol");
  }
  return encodeMessage(encodeVarintField(1, request.chaseTeamType));
}

/** Request for a Chase leaderboard. */
export interface ChaseRankingRequest {
  readonly chaseTeamType: ChaseTeamType;
}

/** Decodes a mini-game leaderboard response. */
export function decodeMiniGameRankingResponse(
  data: Buffer,
): MiniGameRankingResponse {
  const fields = decodeProtoFields(data);
  return {
    selfRank: firstInt32(fields, 1) ?? 0,
    rankInfos: decodeRepeated(fields, 2),
  };
}

function decodeRepeated(
  fields: Map<number, ProtoValue[]>,
  field: number,
): BasicRankingRankInfo[] {
  return (fields.get(field) ?? [])
    .filter(isBuffer)
    .map(decodeBasicRankingRankInfo);
}
