import {
  decodeMusicCreativeChartGetByIdResponse,
  decodeMusicCreativeChartGetCreatorInfoResponse,
  decodeMusicCreativeChartGetEarlyClearLiveDeckResponse,
  decodeMusicCreativeChartGetEarlyClearRankingInfoResponse,
  decodeMusicCreativeChartGetQuoteTargetChartResponse,
  decodeMusicCreativeChartListByCreatorResponse,
  decodeMusicCreativeChartListPopularCreatorResponse,
  decodeMusicCreativeChartListResponse,
  encodeMusicCreativeChartGetByIdRequest,
  encodeMusicCreativeChartGetEarlyClearLiveDeckRequest,
  encodeMusicCreativeChartGetEarlyClearRankingInfoRequest,
  encodeMusicCreativeChartIdRequest,
  encodeMusicCreativeChartListByCreatorRequest,
  encodeMusicCreativeChartListPopularCreatorRequest,
  encodeMusicCreativeChartListRequest,
  type MusicCreativeChartGetByIdRequest,
  type MusicCreativeChartGetByIdResponse,
  type MusicCreativeChartGetCreatorInfoRequest,
  type MusicCreativeChartGetCreatorInfoResponse,
  type MusicCreativeChartGetEarlyClearLiveDeckRequest,
  type MusicCreativeChartGetEarlyClearLiveDeckResponse,
  type MusicCreativeChartGetEarlyClearRankingInfoRequest,
  type MusicCreativeChartGetEarlyClearRankingInfoResponse,
  type MusicCreativeChartGetQuoteTargetChartRequest,
  type MusicCreativeChartGetQuoteTargetChartResponse,
  type MusicCreativeChartListByCreatorRequest,
  type MusicCreativeChartListByCreatorResponse,
  type MusicCreativeChartListPopularCreatorRequest,
  type MusicCreativeChartListPopularCreatorResponse,
  type MusicCreativeChartListRequest,
  type MusicCreativeChartListResponse,
} from "../codecs/music-creative-chart.js";
import { type ApiClient } from "../core/client.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";

const MUSIC_CREATIVE_CHART_LIST_NEWER: ApiMethod<
  MusicCreativeChartListRequest,
  MusicCreativeChartListResponse
> = {
  path: "/rpc.api.MusicCreativeChart/ListNewer",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeMusicCreativeChartListRequest,
  decode: decodeMusicCreativeChartListResponse,
};

const MUSIC_CREATIVE_CHART_LIST_POPULAR: ApiMethod<
  MusicCreativeChartListRequest,
  MusicCreativeChartListResponse
> = {
  path: "/rpc.api.MusicCreativeChart/ListPopular",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeMusicCreativeChartListRequest,
  decode: decodeMusicCreativeChartListResponse,
};

const MUSIC_CREATIVE_CHART_LIST_POPULAR_CREATOR: ApiMethod<
  MusicCreativeChartListPopularCreatorRequest,
  MusicCreativeChartListPopularCreatorResponse
> = {
  path: "/rpc.api.MusicCreativeChart/ListPopularCreator",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeMusicCreativeChartListPopularCreatorRequest,
  decode: decodeMusicCreativeChartListPopularCreatorResponse,
};

const MUSIC_CREATIVE_CHART_LIST_BY_CREATOR: ApiMethod<
  MusicCreativeChartListByCreatorRequest,
  MusicCreativeChartListByCreatorResponse
> = {
  path: "/rpc.api.MusicCreativeChart/ListByCreator",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeMusicCreativeChartListByCreatorRequest,
  decode: decodeMusicCreativeChartListByCreatorResponse,
};

const MUSIC_CREATIVE_CHART_GET_BY_ID: ApiMethod<
  MusicCreativeChartGetByIdRequest,
  MusicCreativeChartGetByIdResponse
> = {
  path: "/rpc.api.MusicCreativeChart/GetByMusicCreativeChartId",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeMusicCreativeChartGetByIdRequest,
  decode: decodeMusicCreativeChartGetByIdResponse,
};

const MUSIC_CREATIVE_CHART_GET_QUOTE_TARGET: ApiMethod<
  MusicCreativeChartGetQuoteTargetChartRequest,
  MusicCreativeChartGetQuoteTargetChartResponse
> = {
  path: "/rpc.api.MusicCreativeChart/GetQuoteTargetChart",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeMusicCreativeChartIdRequest,
  decode: decodeMusicCreativeChartGetQuoteTargetChartResponse,
};

const MUSIC_CREATIVE_CHART_GET_CREATOR_INFO: ApiMethod<
  MusicCreativeChartGetCreatorInfoRequest,
  MusicCreativeChartGetCreatorInfoResponse
> = {
  path: "/rpc.api.MusicCreativeChart/GetCreatorInfoByMusicCreativeChartId",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeMusicCreativeChartIdRequest,
  decode: decodeMusicCreativeChartGetCreatorInfoResponse,
};

const MUSIC_CREATIVE_CHART_GET_EARLY_CLEAR_RANKING_INFO: ApiMethod<
  MusicCreativeChartGetEarlyClearRankingInfoRequest,
  MusicCreativeChartGetEarlyClearRankingInfoResponse
> = {
  path: "/rpc.api.MusicCreativeChart/GetEarlyClearRankingInfo",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeMusicCreativeChartGetEarlyClearRankingInfoRequest,
  decode: decodeMusicCreativeChartGetEarlyClearRankingInfoResponse,
};

const MUSIC_CREATIVE_CHART_GET_EARLY_CLEAR_LIVE_DECK: ApiMethod<
  MusicCreativeChartGetEarlyClearLiveDeckRequest,
  MusicCreativeChartGetEarlyClearLiveDeckResponse
> = {
  path: "/rpc.api.MusicCreativeChart/GetEarlyClearLiveDeck",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeMusicCreativeChartGetEarlyClearLiveDeckRequest,
  decode: decodeMusicCreativeChartGetEarlyClearLiveDeckResponse,
};

/** Reads public user generated charts, creator lists, and early-clear rankings.
 * @remarks Chart `isFavorite` and `isOwn` fields reflect the authenticated account.
 */
export class MusicCreativeChartApi {
  constructor(
    private readonly client: ApiClient,
    private readonly ensureAuthenticated: () => Promise<unknown>,
  ) {}

  /** Lists recently published charts grouped by song. @rpc /rpc.api.MusicCreativeChart/ListNewer */
  async listNewer(
    request: MusicCreativeChartListRequest = {},
    options?: RequestOptions,
  ): Promise<MusicCreativeChartListResponse> {
    await this.ensureAuthenticated();
    return this.client.call(
      MUSIC_CREATIVE_CHART_LIST_NEWER,
      withDefaultSearch(request),
      options,
    );
  }

  /** Lists popular charts grouped by song. @rpc /rpc.api.MusicCreativeChart/ListPopular */
  async listPopular(
    request: MusicCreativeChartListRequest = {},
    options?: RequestOptions,
  ): Promise<MusicCreativeChartListResponse> {
    await this.ensureAuthenticated();
    return this.client.call(
      MUSIC_CREATIVE_CHART_LIST_POPULAR,
      withDefaultSearch(request),
      options,
    );
  }

  /** Lists popular chart creators for a reset interval. @rpc /rpc.api.MusicCreativeChart/ListPopularCreator */
  async listPopularCreator(
    request: MusicCreativeChartListPopularCreatorRequest = {},
    options?: RequestOptions,
  ): Promise<MusicCreativeChartListPopularCreatorResponse> {
    await this.ensureAuthenticated();
    return this.client.call(
      MUSIC_CREATIVE_CHART_LIST_POPULAR_CREATOR,
      request,
      options,
    );
  }

  /** Lists public charts by creator public user ID. @rpc /rpc.api.MusicCreativeChart/ListByCreator */
  async listByCreator(
    request: MusicCreativeChartListByCreatorRequest,
    options?: RequestOptions,
  ): Promise<MusicCreativeChartListByCreatorResponse> {
    await this.ensureAuthenticated();
    return this.client.call(
      MUSIC_CREATIVE_CHART_LIST_BY_CREATOR,
      withDefaultSearch(request),
      options,
    );
  }

  /** Returns a chart by its ID. @rpc /rpc.api.MusicCreativeChart/GetByMusicCreativeChartId */
  async getByMusicCreativeChartId(
    request: MusicCreativeChartGetByIdRequest,
    options?: RequestOptions,
  ): Promise<MusicCreativeChartGetByIdResponse> {
    await this.ensureAuthenticated();
    return this.client.call(MUSIC_CREATIVE_CHART_GET_BY_ID, request, options);
  }

  /** Returns the chart file URL used when quoting a chart. @rpc /rpc.api.MusicCreativeChart/GetQuoteTargetChart */
  async getQuoteTargetChart(
    request: MusicCreativeChartGetQuoteTargetChartRequest,
    options?: RequestOptions,
  ): Promise<MusicCreativeChartGetQuoteTargetChartResponse> {
    await this.ensureAuthenticated();
    return this.client.call(
      MUSIC_CREATIVE_CHART_GET_QUOTE_TARGET,
      request,
      options,
    );
  }

  /** Returns the chart creator and related creator accounts. @rpc /rpc.api.MusicCreativeChart/GetCreatorInfoByMusicCreativeChartId */
  async getCreatorInfoByMusicCreativeChartId(
    request: MusicCreativeChartGetCreatorInfoRequest,
    options?: RequestOptions,
  ): Promise<MusicCreativeChartGetCreatorInfoResponse> {
    await this.ensureAuthenticated();
    return this.client.call(
      MUSIC_CREATIVE_CHART_GET_CREATOR_INFO,
      request,
      options,
    );
  }

  /** Returns early-clear ranks for a chart and live result type. @rpc /rpc.api.MusicCreativeChart/GetEarlyClearRankingInfo @remarks The response also includes the authenticated account's self ranking. */
  async getEarlyClearRankingInfo(
    request: MusicCreativeChartGetEarlyClearRankingInfoRequest,
    options?: RequestOptions,
  ): Promise<MusicCreativeChartGetEarlyClearRankingInfoResponse> {
    await this.ensureAuthenticated();
    return this.client.call(
      MUSIC_CREATIVE_CHART_GET_EARLY_CLEAR_RANKING_INFO,
      request,
      options,
    );
  }

  /** Returns a listed user's deck for an early-clear chart rank. @rpc /rpc.api.MusicCreativeChart/GetEarlyClearLiveDeck */
  async getEarlyClearLiveDeck(
    request: MusicCreativeChartGetEarlyClearLiveDeckRequest,
    options?: RequestOptions,
  ): Promise<MusicCreativeChartGetEarlyClearLiveDeckResponse> {
    await this.ensureAuthenticated();
    return this.client.call(
      MUSIC_CREATIVE_CHART_GET_EARLY_CLEAR_LIVE_DECK,
      request,
      options,
    );
  }
}

function withDefaultSearch<
  T extends
    MusicCreativeChartListByCreatorRequest | MusicCreativeChartListRequest,
>(request: T): T {
  return request.searchParameter === undefined
    ? {
        ...request,
        searchParameter: { isSearchAllMusic: true },
      }
    : request;
}

export {
  MUSIC_CREATIVE_CHART_GET_BY_ID,
  MUSIC_CREATIVE_CHART_GET_CREATOR_INFO,
  MUSIC_CREATIVE_CHART_GET_EARLY_CLEAR_LIVE_DECK,
  MUSIC_CREATIVE_CHART_GET_EARLY_CLEAR_RANKING_INFO,
  MUSIC_CREATIVE_CHART_GET_QUOTE_TARGET,
  MUSIC_CREATIVE_CHART_LIST_BY_CREATOR,
  MUSIC_CREATIVE_CHART_LIST_NEWER,
  MUSIC_CREATIVE_CHART_LIST_POPULAR,
  MUSIC_CREATIVE_CHART_LIST_POPULAR_CREATOR,
};

export type {
  MusicCreativeChartCreatorInfo,
  MusicCreativeChartGetByIdRequest,
  MusicCreativeChartGetByIdResponse,
  MusicCreativeChartGetCreatorInfoRequest,
  MusicCreativeChartGetCreatorInfoResponse,
  MusicCreativeChartGetEarlyClearLiveDeckRequest,
  MusicCreativeChartGetEarlyClearLiveDeckResponse,
  MusicCreativeChartGetEarlyClearRankingInfoRequest,
  MusicCreativeChartGetEarlyClearRankingInfoResponse,
  MusicCreativeChartGetQuoteTargetChartRequest,
  MusicCreativeChartGetQuoteTargetChartResponse,
  MusicCreativeChartInfo,
  MusicCreativeChartInfoMusicGrouping,
  MusicCreativeChartListByCreatorRequest,
  MusicCreativeChartListByCreatorResponse,
  MusicCreativeChartListPopularCreatorRequest,
  MusicCreativeChartListPopularCreatorResponse,
  MusicCreativeChartListRequest,
  MusicCreativeChartListResponse,
  MusicCreativeChartSearchParameter,
} from "../codecs/music-creative-chart.js";
