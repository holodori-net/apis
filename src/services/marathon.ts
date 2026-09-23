import {
  decodeMarathonMusicRankingResponse,
  decodeMarathonScoreRankingResponse,
  decodeMarathonTopResponse,
  encodeMarathonListMusicHighestScoreRankingRequest,
  encodeMarathonListRankingRequest,
  encodeMarathonTopRequest,
  type MarathonListMusicHighestScoreRankingRequest,
  type MarathonListRankingRequest,
  type MarathonMusicRankingResponse,
  type MarathonScoreRankingResponse,
  type MarathonTopRequest,
  type MarathonTopResponse,
} from "../codecs/marathon.js";
import { type ApiClient } from "../core/client.js";
import { type ApiMethod } from "../core/method.js";

const MARATHON_TOP: ApiMethod<MarathonTopRequest, MarathonTopResponse> = {
  path: "/rpc.api.Marathon/Top",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeMarathonTopRequest,
  decode: decodeMarathonTopResponse,
};

const MARATHON_LIST_MUSIC_HIGHEST_SCORE_RANKING_GRADE: ApiMethod<
  MarathonListMusicHighestScoreRankingRequest,
  MarathonMusicRankingResponse
> = {
  path: "/rpc.api.Marathon/ListMusicHighestScoreRankingGrade",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeMarathonListMusicHighestScoreRankingRequest,
  decode: decodeMarathonMusicRankingResponse,
};

const MARATHON_LIST_MUSIC_HIGHEST_SCORE_RANKING_TOP: ApiMethod<
  MarathonListMusicHighestScoreRankingRequest,
  MarathonMusicRankingResponse
> = {
  path: "/rpc.api.Marathon/ListMusicHighestScoreRankingTop",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeMarathonListMusicHighestScoreRankingRequest,
  decode: decodeMarathonMusicRankingResponse,
};

const MARATHON_LIST_SCORE_RANKING_GRADE: ApiMethod<
  MarathonListRankingRequest,
  MarathonScoreRankingResponse
> = {
  path: "/rpc.api.Marathon/ListMarathonScoreRankingGrade",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeMarathonListRankingRequest,
  decode: decodeMarathonScoreRankingResponse,
};

const MARATHON_LIST_SCORE_RANKING_TOP: ApiMethod<
  MarathonListRankingRequest,
  MarathonScoreRankingResponse
> = {
  path: "/rpc.api.Marathon/ListMarathonScoreRankingTop",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeMarathonListRankingRequest,
  decode: decodeMarathonScoreRankingResponse,
};

const MARATHON_LIST_TOTAL_MUSIC_HIGHEST_SCORE_RANKING_GRADE: ApiMethod<
  MarathonListRankingRequest,
  MarathonScoreRankingResponse
> = {
  path: "/rpc.api.Marathon/ListTotalMusicHighestScoreRankingGrade",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeMarathonListRankingRequest,
  decode: decodeMarathonScoreRankingResponse,
};

const MARATHON_LIST_TOTAL_MUSIC_HIGHEST_SCORE_RANKING_TOP: ApiMethod<
  MarathonListRankingRequest,
  MarathonScoreRankingResponse
> = {
  path: "/rpc.api.Marathon/ListTotalMusicHighestScoreRankingTop",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeMarathonListRankingRequest,
  decode: decodeMarathonScoreRankingResponse,
};

/** Provides Marathon configuration, public rankings, and ranking results. */
export class MarathonApi {
  constructor(
    private readonly client: ApiClient,
    private readonly ensureAuthenticated: () => Promise<unknown>,
  ) {}

  /**
   * Returns Marathon metadata, chapters, rewards, bonuses, and account ranks.
   *
   * @rpc /rpc.api.Marathon/Top
   * @remarks The ranking result includes ranks and rewards for the authenticated account.
   */
  async top(request: MarathonTopRequest): Promise<MarathonTopResponse> {
    await this.ensureAuthenticated();
    return this.client.call(MARATHON_TOP, request);
  }

  /**
   * Lists music-score ranking grades for a chapter and song.
   *
   * @rpc /rpc.api.Marathon/ListMusicHighestScoreRankingGrade
   * @remarks Each result includes the authenticated account's self rank and score.
   */
  async listMusicHighestScoreRankingGrade(
    request: MarathonListMusicHighestScoreRankingRequest,
  ): Promise<MarathonMusicRankingResponse> {
    await this.ensureAuthenticated();
    return this.client.call(
      MARATHON_LIST_MUSIC_HIGHEST_SCORE_RANKING_GRADE,
      request,
    );
  }

  /**
   * Lists top music scores for a chapter and song.
   *
   * @rpc /rpc.api.Marathon/ListMusicHighestScoreRankingTop
   * @remarks Each result includes the authenticated account's self rank and score.
   */
  async listMusicHighestScoreRankingTop(
    request: MarathonListMusicHighestScoreRankingRequest,
  ): Promise<MarathonMusicRankingResponse> {
    await this.ensureAuthenticated();
    return this.client.call(
      MARATHON_LIST_MUSIC_HIGHEST_SCORE_RANKING_TOP,
      request,
    );
  }

  /**
   * Lists Marathon score ranking grades for a chapter.
   *
   * @rpc /rpc.api.Marathon/ListMarathonScoreRankingGrade
   * @remarks Each result includes the authenticated account's self rank and score.
   */
  async listMarathonScoreRankingGrade(
    request: MarathonListRankingRequest,
  ): Promise<MarathonScoreRankingResponse> {
    await this.ensureAuthenticated();
    return this.client.call(MARATHON_LIST_SCORE_RANKING_GRADE, request);
  }

  /**
   * Lists top Marathon scores for a chapter.
   *
   * @rpc /rpc.api.Marathon/ListMarathonScoreRankingTop
   * @remarks Each result includes the authenticated account's self rank and score.
   */
  async listMarathonScoreRankingTop(
    request: MarathonListRankingRequest,
  ): Promise<MarathonScoreRankingResponse> {
    await this.ensureAuthenticated();
    return this.client.call(MARATHON_LIST_SCORE_RANKING_TOP, request);
  }

  /**
   * Lists total music-score ranking grades for a chapter.
   *
   * @rpc /rpc.api.Marathon/ListTotalMusicHighestScoreRankingGrade
   * @remarks Each result includes the authenticated account's self rank and score.
   */
  async listTotalMusicHighestScoreRankingGrade(
    request: MarathonListRankingRequest,
  ): Promise<MarathonScoreRankingResponse> {
    await this.ensureAuthenticated();
    return this.client.call(
      MARATHON_LIST_TOTAL_MUSIC_HIGHEST_SCORE_RANKING_GRADE,
      request,
    );
  }

  /**
   * Lists top total music scores for a chapter.
   *
   * @rpc /rpc.api.Marathon/ListTotalMusicHighestScoreRankingTop
   * @remarks Each result includes the authenticated account's self rank and score.
   */
  async listTotalMusicHighestScoreRankingTop(
    request: MarathonListRankingRequest,
  ): Promise<MarathonScoreRankingResponse> {
    await this.ensureAuthenticated();
    return this.client.call(
      MARATHON_LIST_TOTAL_MUSIC_HIGHEST_SCORE_RANKING_TOP,
      request,
    );
  }
}

export {
  MARATHON_LIST_MUSIC_HIGHEST_SCORE_RANKING_GRADE,
  MARATHON_LIST_MUSIC_HIGHEST_SCORE_RANKING_TOP,
  MARATHON_LIST_SCORE_RANKING_GRADE,
  MARATHON_LIST_SCORE_RANKING_TOP,
  MARATHON_LIST_TOTAL_MUSIC_HIGHEST_SCORE_RANKING_GRADE,
  MARATHON_LIST_TOTAL_MUSIC_HIGHEST_SCORE_RANKING_TOP,
  MARATHON_TOP,
};

export type {
  MarathonChapter,
  MarathonInfo,
  MarathonListMusicHighestScoreRankingRequest,
  MarathonListRankingRequest,
  MarathonLiveScoreBonus,
  MarathonMiniGameScoreBonus,
  MarathonMiniGameScoreRate,
  MarathonMusicPersonalRankingResult,
  MarathonMusicRankingRankReward,
  MarathonMusicRankingResponse,
  MarathonMusicScoreBonus,
  MarathonPersonalChapterRankingResult,
  MarathonPersonalRankingResult,
  MarathonRankingResult,
  MarathonScoreRankingRankReward,
  MarathonScoreRankingResponse,
  MarathonScoreReward,
  MarathonTopRequest,
  MarathonTopResponse,
  MarathonTotalMusicRankingReward,
} from "../codecs/marathon.js";
