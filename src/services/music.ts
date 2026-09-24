import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import {
  decodeProtobuf,
  encodeProtobuf,
  type ProtobufMessageInit,
} from "../protos/codec.js";
import {
  MusicGetHighestScoreLiveDeckRequestSchema,
  type MusicGetHighestScoreLiveDeckResponse,
  MusicGetHighestScoreLiveDeckResponseSchema,
  MusicGetHighestScoreRankingInfoRequestSchema,
  type MusicGetHighestScoreRankingInfoResponse,
  MusicGetHighestScoreRankingInfoResponseSchema,
  MusicGetHighestScoreRatingRankingInfoRequestSchema,
  type MusicGetHighestScoreRatingRankingInfoResponse,
  MusicGetHighestScoreRatingRankingInfoResponseSchema,
  MusicListHighestScoreRatingRankingRankRequestSchema,
  type MusicListHighestScoreRatingRankingRankResponse,
  MusicListHighestScoreRatingRankingRankResponseSchema,
  MusicListHighestScoreRatingRankingRewardThresholdRankingRankInfoRequestSchema,
  type MusicListHighestScoreRatingRankingRewardThresholdRankingRankInfoResponse,
  MusicListHighestScoreRatingRankingRewardThresholdRankingRankInfoResponseSchema,
} from "../protos/gen/rpc/api/music.gen_pb.js";

export type MusicGetHighestScoreLiveDeckRequest = ProtobufMessageInit<
  typeof MusicGetHighestScoreLiveDeckRequestSchema
> & { publicUserId: string; musicId: string };
export type MusicGetHighestScoreRankingInfoRequest = ProtobufMessageInit<
  typeof MusicGetHighestScoreRankingInfoRequestSchema
> & { musicId: string };
export type MusicListHighestScoreRatingRankingRankRequest = ProtobufMessageInit<
  typeof MusicListHighestScoreRatingRankingRankRequestSchema
> & { characterIds: readonly string[] };
export type MusicGetHighestScoreRatingRankingInfoRequest = ProtobufMessageInit<
  typeof MusicGetHighestScoreRatingRankingInfoRequestSchema
> & { characterId: string };
export type MusicListHighestScoreRatingRankingRewardThresholdRankingRankInfoRequest =
  ProtobufMessageInit<
    typeof MusicListHighestScoreRatingRankingRewardThresholdRankingRankInfoRequestSchema
  > & { characterId: string };

const MUSIC_GET_HIGHEST_SCORE_LIVE_DECK: ApiMethod<
  MusicGetHighestScoreLiveDeckRequest,
  MusicGetHighestScoreLiveDeckResponse
> = {
  path: "/rpc.api.Music/GetHighestScoreLiveDeck",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: (request) =>
    encodeProtobuf(MusicGetHighestScoreLiveDeckRequestSchema, {
      publicUserId: requireNonEmpty(request.publicUserId, "public user ID"),
      musicId: requireNonEmpty(request.musicId, "music ID"),
    }),
  decode: (data) =>
    decodeProtobuf(MusicGetHighestScoreLiveDeckResponseSchema, data),
};

const MUSIC_GET_HIGHEST_SCORE_RANKING_INFO: ApiMethod<
  MusicGetHighestScoreRankingInfoRequest,
  MusicGetHighestScoreRankingInfoResponse
> = {
  path: "/rpc.api.Music/GetHighestScoreRankingInfo",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: (request) =>
    encodeProtobuf(MusicGetHighestScoreRankingInfoRequestSchema, {
      musicId: requireNonEmpty(request.musicId, "music ID"),
    }),
  decode: (data) =>
    decodeProtobuf(MusicGetHighestScoreRankingInfoResponseSchema, data),
};

const MUSIC_LIST_HIGHEST_SCORE_RATING_RANKING_RANK: ApiMethod<
  MusicListHighestScoreRatingRankingRankRequest,
  MusicListHighestScoreRatingRankingRankResponse
> = {
  path: "/rpc.api.Music/ListHighestScoreRatingRankingRank",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: (request) => {
    validateUniqueNonEmpty(request.characterIds, "character IDs");
    return encodeProtobuf(
      MusicListHighestScoreRatingRankingRankRequestSchema,
      request,
    );
  },
  decode: (data) =>
    decodeProtobuf(MusicListHighestScoreRatingRankingRankResponseSchema, data),
};

const MUSIC_GET_HIGHEST_SCORE_RATING_RANKING_INFO: ApiMethod<
  MusicGetHighestScoreRatingRankingInfoRequest,
  MusicGetHighestScoreRatingRankingInfoResponse
> = {
  path: "/rpc.api.Music/GetHighestScoreRatingRankingInfo",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: (request) =>
    encodeProtobuf(MusicGetHighestScoreRatingRankingInfoRequestSchema, {
      characterId: requireNonEmpty(request.characterId, "character ID"),
    }),
  decode: (data) =>
    decodeProtobuf(MusicGetHighestScoreRatingRankingInfoResponseSchema, data),
};

const MUSIC_LIST_HIGHEST_SCORE_RATING_RANKING_REWARD_THRESHOLD_RANKING_RANK_INFO: ApiMethod<
  MusicListHighestScoreRatingRankingRewardThresholdRankingRankInfoRequest,
  MusicListHighestScoreRatingRankingRewardThresholdRankingRankInfoResponse
> = {
  path: "/rpc.api.Music/ListHighestScoreRatingRankingRewardThresholdRankingRankInfo",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: (request) =>
    encodeProtobuf(
      MusicListHighestScoreRatingRankingRewardThresholdRankingRankInfoRequestSchema,
      { characterId: requireNonEmpty(request.characterId, "character ID") },
    ),
  decode: (data) =>
    decodeProtobuf(
      MusicListHighestScoreRatingRankingRewardThresholdRankingRankInfoResponseSchema,
      data,
    ),
};

/** Reads music score and per-character rating rankings. */
export class MusicApi {
  constructor(private readonly client: ApiCaller) {}

  /** Returns a public player's deck used for their highest score on a song. @rpc /rpc.api.Music/GetHighestScoreLiveDeck */
  async getHighestScoreLiveDeck(
    request: MusicGetHighestScoreLiveDeckRequest,
    options?: RequestOptions,
  ): Promise<MusicGetHighestScoreLiveDeckResponse> {
    return this.client.call(
      MUSIC_GET_HIGHEST_SCORE_LIVE_DECK,
      request,
      options,
    );
  }

  /**
   * Returns the song's score ranking and the current account's rank by difficulty.
   * @rpc /rpc.api.Music/GetHighestScoreRankingInfo
   * @remarks `selfRank` and `selfMusicDifficultyScoreInfos` depend on the authenticated account.
   */
  async getHighestScoreRankingInfo(
    request: MusicGetHighestScoreRankingInfoRequest,
    options?: RequestOptions,
  ): Promise<MusicGetHighestScoreRankingInfoResponse> {
    return this.client.call(
      MUSIC_GET_HIGHEST_SCORE_RANKING_INFO,
      request,
      options,
    );
  }

  /** Returns ranks for the requested characters in the highest-score rating ranking. @rpc /rpc.api.Music/ListHighestScoreRatingRankingRank */
  async listHighestScoreRatingRankingRank(
    request: MusicListHighestScoreRatingRankingRankRequest,
    options?: RequestOptions,
  ): Promise<MusicListHighestScoreRatingRankingRankResponse> {
    return this.client.call(
      MUSIC_LIST_HIGHEST_SCORE_RATING_RANKING_RANK,
      request,
      options,
    );
  }

  /**
   * Returns the highest-score rating leaderboard for a character.
   * @rpc /rpc.api.Music/GetHighestScoreRatingRankingInfo
   */
  async getHighestScoreRatingRankingInfo(
    request: MusicGetHighestScoreRatingRankingInfoRequest,
    options?: RequestOptions,
  ): Promise<MusicGetHighestScoreRatingRankingInfoResponse> {
    return this.client.call(
      MUSIC_GET_HIGHEST_SCORE_RATING_RANKING_INFO,
      request,
      options,
    );
  }

  /** Returns the score thresholds and last update time for a character's rating ranking. @rpc /rpc.api.Music/ListHighestScoreRatingRankingRewardThresholdRankingRankInfo */
  async listHighestScoreRatingRankingRewardThresholdRankingRankInfo(
    request: MusicListHighestScoreRatingRankingRewardThresholdRankingRankInfoRequest,
    options?: RequestOptions,
  ): Promise<MusicListHighestScoreRatingRankingRewardThresholdRankingRankInfoResponse> {
    return this.client.call(
      MUSIC_LIST_HIGHEST_SCORE_RATING_RANKING_REWARD_THRESHOLD_RANKING_RANK_INFO,
      request,
      options,
    );
  }
}

export {
  MUSIC_GET_HIGHEST_SCORE_LIVE_DECK,
  MUSIC_GET_HIGHEST_SCORE_RANKING_INFO,
  MUSIC_GET_HIGHEST_SCORE_RATING_RANKING_INFO,
  MUSIC_LIST_HIGHEST_SCORE_RATING_RANKING_RANK,
  MUSIC_LIST_HIGHEST_SCORE_RATING_RANKING_REWARD_THRESHOLD_RANKING_RANK_INFO,
};
export type { RankingLiveDeckInfo } from "../protos/gen/rpc/api/common/ranking.gen_pb.js";
export type {
  MusicGetHighestScoreLiveDeckResponse,
  MusicGetHighestScoreRankingInfoResponse,
  MusicGetHighestScoreRatingRankingInfoResponse,
  MusicListHighestScoreRatingRankingRankResponse,
  MusicListHighestScoreRatingRankingRewardThresholdRankingRankInfoResponse,
} from "../protos/gen/rpc/api/music.gen_pb.js";

function requireNonEmpty(value: string, name: string): string {
  if (value.length === 0) throw new RangeError(`${name} must not be empty`);
  return value;
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
