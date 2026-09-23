import {
  decodeMusicGetHighestScoreLiveDeckResponse,
  decodeMusicGetHighestScoreRankingInfoResponse,
  decodeMusicGetHighestScoreRatingRankingInfoResponse,
  decodeMusicListHighestScoreRatingRankingRankResponse,
  decodeMusicListHighestScoreRatingRankingRewardThresholdRankingRankInfoResponse,
  encodeMusicGetHighestScoreLiveDeckRequest,
  encodeMusicGetHighestScoreRankingInfoRequest,
  encodeMusicGetHighestScoreRatingRankingInfoRequest,
  encodeMusicListHighestScoreRatingRankingRankRequest,
  encodeMusicListHighestScoreRatingRankingRewardThresholdRankingRankInfoRequest,
  type MusicGetHighestScoreLiveDeckRequest,
  type MusicGetHighestScoreLiveDeckResponse,
  type MusicGetHighestScoreRankingInfoRequest,
  type MusicGetHighestScoreRankingInfoResponse,
  type MusicGetHighestScoreRatingRankingInfoRequest,
  type MusicGetHighestScoreRatingRankingInfoResponse,
  type MusicListHighestScoreRatingRankingRankRequest,
  type MusicListHighestScoreRatingRankingRankResponse,
  type MusicListHighestScoreRatingRankingRewardThresholdRankingRankInfoRequest,
  type MusicListHighestScoreRatingRankingRewardThresholdRankingRankInfoResponse,
} from "../codecs/music.js";
import { type ApiClient } from "../core/client.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";

const MUSIC_GET_HIGHEST_SCORE_LIVE_DECK: ApiMethod<
  MusicGetHighestScoreLiveDeckRequest,
  MusicGetHighestScoreLiveDeckResponse
> = {
  path: "/rpc.api.Music/GetHighestScoreLiveDeck",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeMusicGetHighestScoreLiveDeckRequest,
  decode: decodeMusicGetHighestScoreLiveDeckResponse,
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
  encode: encodeMusicGetHighestScoreRankingInfoRequest,
  decode: decodeMusicGetHighestScoreRankingInfoResponse,
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
  encode: encodeMusicListHighestScoreRatingRankingRankRequest,
  decode: decodeMusicListHighestScoreRatingRankingRankResponse,
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
  encode: encodeMusicGetHighestScoreRatingRankingInfoRequest,
  decode: decodeMusicGetHighestScoreRatingRankingInfoResponse,
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
  encode:
    encodeMusicListHighestScoreRatingRankingRewardThresholdRankingRankInfoRequest,
  decode:
    decodeMusicListHighestScoreRatingRankingRewardThresholdRankingRankInfoResponse,
};

/** Reads music score and per-character rating rankings. */
export class MusicApi {
  constructor(
    private readonly client: ApiClient,
    private readonly ensureAuthenticated: () => Promise<unknown>,
  ) {}

  /** Returns a public player's deck used for their highest score on a song. @rpc /rpc.api.Music/GetHighestScoreLiveDeck */
  async getHighestScoreLiveDeck(
    request: MusicGetHighestScoreLiveDeckRequest,
    options?: RequestOptions,
  ): Promise<MusicGetHighestScoreLiveDeckResponse> {
    await this.ensureAuthenticated();
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
    await this.ensureAuthenticated();
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
    await this.ensureAuthenticated();
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
    await this.ensureAuthenticated();
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
    await this.ensureAuthenticated();
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
export type {
  MusicDifficultyScoreInfo,
  MusicGetHighestScoreLiveDeckRequest,
  MusicGetHighestScoreLiveDeckResponse,
  MusicGetHighestScoreRankingInfoRequest,
  MusicGetHighestScoreRankingInfoResponse,
  MusicGetHighestScoreRatingRankingInfoRequest,
  MusicGetHighestScoreRatingRankingInfoResponse,
  MusicHighestScoreRatingRankingRankInfo,
  MusicListHighestScoreRatingRankingRankRequest,
  MusicListHighestScoreRatingRankingRankResponse,
  MusicListHighestScoreRatingRankingRewardThresholdRankingRankInfoRequest,
  MusicListHighestScoreRatingRankingRewardThresholdRankingRankInfoResponse,
  MusicThresholdRankingRankInfo,
} from "../codecs/music.js";
export type {
  BasicRankingRankInfo,
  RankingLiveDeckCard,
  RankingLiveDeckInfo,
} from "../codecs/ranking.js";
