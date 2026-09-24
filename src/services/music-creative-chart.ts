import type { MusicCreativeChartSearchParameterSchema } from "../protos/gen/rpc/api/common/music_creative_chart.gen_pb.js";

import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import {
  decodeProtobuf,
  encodeProtobuf,
  type ProtobufMessageInit,
} from "../protos/codec.js";
import {
  MusicCreativeChartGetByMusicCreativeChartIdRequestSchema,
  type MusicCreativeChartGetByMusicCreativeChartIdResponse,
  MusicCreativeChartGetByMusicCreativeChartIdResponseSchema,
  MusicCreativeChartGetCreatorInfoByMusicCreativeChartIdRequestSchema,
  type MusicCreativeChartGetCreatorInfoByMusicCreativeChartIdResponse,
  MusicCreativeChartGetCreatorInfoByMusicCreativeChartIdResponseSchema,
  MusicCreativeChartGetEarlyClearLiveDeckRequestSchema,
  type MusicCreativeChartGetEarlyClearLiveDeckResponse,
  MusicCreativeChartGetEarlyClearLiveDeckResponseSchema,
  MusicCreativeChartGetEarlyClearRankingInfoRequestSchema,
  type MusicCreativeChartGetEarlyClearRankingInfoResponse,
  MusicCreativeChartGetEarlyClearRankingInfoResponseSchema,
  MusicCreativeChartGetQuoteTargetChartRequestSchema,
  type MusicCreativeChartGetQuoteTargetChartResponse,
  MusicCreativeChartGetQuoteTargetChartResponseSchema,
  MusicCreativeChartListByCreatorRequestSchema,
  type MusicCreativeChartListByCreatorResponse,
  MusicCreativeChartListByCreatorResponseSchema,
  MusicCreativeChartListNewerRequestSchema,
  type MusicCreativeChartListNewerResponse,
  MusicCreativeChartListNewerResponseSchema,
  MusicCreativeChartListPopularCreatorRequestSchema,
  type MusicCreativeChartListPopularCreatorResponse,
  MusicCreativeChartListPopularCreatorResponseSchema,
  MusicCreativeChartListPopularRequestSchema,
  type MusicCreativeChartListPopularResponse,
  MusicCreativeChartListPopularResponseSchema,
} from "../protos/gen/rpc/api/music_creative_chart.gen_pb.js";

export type MusicCreativeChartListRequest = Omit<
  ProtobufMessageInit<typeof MusicCreativeChartListNewerRequestSchema>,
  "$typeName"
>;
export type MusicCreativeChartListByCreatorRequest = ProtobufMessageInit<
  typeof MusicCreativeChartListByCreatorRequestSchema
>;
export type MusicCreativeChartListPopularCreatorRequest = ProtobufMessageInit<
  typeof MusicCreativeChartListPopularCreatorRequestSchema
>;
export type MusicCreativeChartGetByIdRequest = Omit<
  ProtobufMessageInit<
    typeof MusicCreativeChartGetByMusicCreativeChartIdRequestSchema
  >,
  "$typeName"
>;
export type MusicCreativeChartGetCreatorInfoRequest = Omit<
  ProtobufMessageInit<
    typeof MusicCreativeChartGetCreatorInfoByMusicCreativeChartIdRequestSchema
  >,
  "$typeName"
>;
export type MusicCreativeChartGetQuoteTargetChartRequest = Omit<
  ProtobufMessageInit<
    typeof MusicCreativeChartGetQuoteTargetChartRequestSchema
  >,
  "$typeName"
>;
export type MusicCreativeChartGetEarlyClearRankingInfoRequest =
  ProtobufMessageInit<
    typeof MusicCreativeChartGetEarlyClearRankingInfoRequestSchema
  >;
export type MusicCreativeChartGetEarlyClearLiveDeckRequest =
  ProtobufMessageInit<
    typeof MusicCreativeChartGetEarlyClearLiveDeckRequestSchema
  >;

const MUSIC_CREATIVE_CHART_LIST_NEWER: ApiMethod<
  MusicCreativeChartListRequest,
  MusicCreativeChartListNewerResponse
> = {
  path: "/rpc.api.MusicCreativeChart/ListNewer",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: (request) => {
    validateSearchParameter(request.searchParameter);
    return encodeProtobuf(MusicCreativeChartListNewerRequestSchema, request);
  },
  decode: (data) =>
    decodeProtobuf(MusicCreativeChartListNewerResponseSchema, data),
};

const MUSIC_CREATIVE_CHART_LIST_POPULAR: ApiMethod<
  MusicCreativeChartListRequest,
  MusicCreativeChartListPopularResponse
> = {
  path: "/rpc.api.MusicCreativeChart/ListPopular",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: (request) => {
    validateSearchParameter(request.searchParameter);
    return encodeProtobuf(MusicCreativeChartListPopularRequestSchema, {
      searchParameter: request.searchParameter,
    });
  },
  decode: (data) =>
    decodeProtobuf(MusicCreativeChartListPopularResponseSchema, data),
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
  encode: (request) => {
    if (request.resetIntervalType !== undefined)
      requireNonNegativeInteger(
        request.resetIntervalType,
        "reset interval type",
      );
    return encodeProtobuf(
      MusicCreativeChartListPopularCreatorRequestSchema,
      request,
    );
  },
  decode: (data) =>
    decodeProtobuf(MusicCreativeChartListPopularCreatorResponseSchema, data),
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
  encode: (request) => {
    validateSearchParameter(request.searchParameter);
    return encodeProtobuf(MusicCreativeChartListByCreatorRequestSchema, {
      ...request,
      publicUserId: requireNonEmpty(request.publicUserId, "public user ID"),
    });
  },
  decode: (data) =>
    decodeProtobuf(MusicCreativeChartListByCreatorResponseSchema, data),
};

const MUSIC_CREATIVE_CHART_GET_BY_ID: ApiMethod<
  MusicCreativeChartGetByIdRequest,
  MusicCreativeChartGetByMusicCreativeChartIdResponse
> = {
  path: "/rpc.api.MusicCreativeChart/GetByMusicCreativeChartId",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: (request) =>
    encodeProtobuf(MusicCreativeChartGetByMusicCreativeChartIdRequestSchema, {
      ...request,
      musicCreativeChartId: requireNonEmpty(
        request.musicCreativeChartId,
        "music creative chart ID",
      ),
    }),
  decode: (data) =>
    decodeProtobuf(
      MusicCreativeChartGetByMusicCreativeChartIdResponseSchema,
      data,
    ),
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
  encode: (request) =>
    encodeProtobuf(MusicCreativeChartGetQuoteTargetChartRequestSchema, {
      musicCreativeChartId: requireNonEmpty(
        request.musicCreativeChartId,
        "music creative chart ID",
      ),
    }),
  decode: (data) =>
    decodeProtobuf(MusicCreativeChartGetQuoteTargetChartResponseSchema, data),
};

const MUSIC_CREATIVE_CHART_GET_CREATOR_INFO: ApiMethod<
  MusicCreativeChartGetCreatorInfoRequest,
  MusicCreativeChartGetCreatorInfoByMusicCreativeChartIdResponse
> = {
  path: "/rpc.api.MusicCreativeChart/GetCreatorInfoByMusicCreativeChartId",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: (request) =>
    encodeProtobuf(
      MusicCreativeChartGetCreatorInfoByMusicCreativeChartIdRequestSchema,
      {
        musicCreativeChartId: requireNonEmpty(
          request.musicCreativeChartId,
          "music creative chart ID",
        ),
      },
    ),
  decode: (data) =>
    decodeProtobuf(
      MusicCreativeChartGetCreatorInfoByMusicCreativeChartIdResponseSchema,
      data,
    ),
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
  encode: (request) => {
    requirePositiveInteger(request.liveResultType, "live result type");
    return encodeProtobuf(
      MusicCreativeChartGetEarlyClearRankingInfoRequestSchema,
      {
        ...request,
        musicCreativeChartId: requireNonEmpty(
          request.musicCreativeChartId,
          "music creative chart ID",
        ),
      },
    );
  },
  decode: (data) =>
    decodeProtobuf(
      MusicCreativeChartGetEarlyClearRankingInfoResponseSchema,
      data,
    ),
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
  encode: (request) => {
    requirePositiveInteger(request.liveResultType, "live result type");
    return encodeProtobuf(
      MusicCreativeChartGetEarlyClearLiveDeckRequestSchema,
      {
        ...request,
        publicUserId: requireNonEmpty(request.publicUserId, "public user ID"),
        musicCreativeChartId: requireNonEmpty(
          request.musicCreativeChartId,
          "music creative chart ID",
        ),
      },
    );
  },
  decode: (data) =>
    decodeProtobuf(MusicCreativeChartGetEarlyClearLiveDeckResponseSchema, data),
};

/** Reads public user generated charts, creator lists, and early-clear rankings.
 * @remarks Chart `isFavorite` and `isOwn` fields reflect the authenticated account.
 */
export class MusicCreativeChartApi {
  constructor(private readonly client: ApiCaller) {}

  /** Lists recently published charts grouped by song. @rpc /rpc.api.MusicCreativeChart/ListNewer */
  async listNewer(
    request: MusicCreativeChartListRequest = {},
    options?: RequestOptions,
  ): Promise<MusicCreativeChartListNewerResponse> {
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
  ): Promise<MusicCreativeChartListPopularResponse> {
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
  ): Promise<MusicCreativeChartGetByMusicCreativeChartIdResponse> {
    return this.client.call(MUSIC_CREATIVE_CHART_GET_BY_ID, request, options);
  }

  /** Returns the chart file URL used when quoting a chart. @rpc /rpc.api.MusicCreativeChart/GetQuoteTargetChart */
  async getQuoteTargetChart(
    request: MusicCreativeChartGetQuoteTargetChartRequest,
    options?: RequestOptions,
  ): Promise<MusicCreativeChartGetQuoteTargetChartResponse> {
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
  ): Promise<MusicCreativeChartGetCreatorInfoByMusicCreativeChartIdResponse> {
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

function validateSearchParameter(
  request:
    | ProtobufMessageInit<typeof MusicCreativeChartSearchParameterSchema>
    | undefined,
): void {
  if (request === undefined) return;
  validateUniqueNonEmptyStrings(request.musicIds, "music IDs");
  validateUniqueNonEmptyStrings(
    request.musicCreativeChartTagIds,
    "music creative chart tag IDs",
  );
  validateUniquePositiveIntegers(request.textSearchTypes, "text search types");
  validateUniquePositiveIntegers(request.chartTypes, "chart types");
  if (request.resetIntervalType !== undefined)
    requireNonNegativeInteger(request.resetIntervalType, "reset interval type");
  if (request.difficultyValueFrom !== undefined)
    requireNonNegativeInteger(
      request.difficultyValueFrom,
      "minimum difficulty value",
    );
  if (request.difficultyValueTo !== undefined)
    requireNonNegativeInteger(
      request.difficultyValueTo,
      "maximum difficulty value",
    );
  if (
    request.difficultyValueFrom !== undefined &&
    request.difficultyValueTo !== undefined &&
    request.difficultyValueFrom > request.difficultyValueTo
  ) {
    throw new RangeError(
      "minimum difficulty value must not exceed maximum difficulty value",
    );
  }
}

function validateUniqueNonEmptyStrings(
  values: readonly string[] | undefined,
  name: string,
): void {
  const seen = new Set<string>();
  for (const value of values ?? []) {
    requireNonEmpty(value, name);
    if (seen.has(value)) throw new RangeError(`${name} must be unique`);
    seen.add(value);
  }
}

function validateUniquePositiveIntegers(
  values: readonly number[] | undefined,
  name: string,
): void {
  const seen = new Set<number>();
  for (const value of values ?? []) {
    requirePositiveInteger(value, name);
    if (seen.has(value)) throw new RangeError(`${name} must be unique`);
    seen.add(value);
  }
}

function requireNonEmpty(value: string | undefined, name: string): string {
  if (typeof value !== "string" || value.length === 0)
    throw new RangeError(`${name} must not be empty`);
  return value;
}

function requirePositiveInteger(value: number | undefined, name: string): void {
  if (value === undefined || !Number.isSafeInteger(value) || value <= 0)
    throw new RangeError(`${name} must be a positive integer`);
}

function requireNonNegativeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new RangeError(`${name} must be a non-negative integer`);
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

export type { MusicCreativeChartSearchParameter } from "../protos/gen/rpc/api/common/music_creative_chart.gen_pb.js";
export type {
  MusicCreativeChartGetByMusicCreativeChartIdResponse as MusicCreativeChartGetByIdResponse,
  MusicCreativeChartGetCreatorInfoByMusicCreativeChartIdResponse as MusicCreativeChartGetCreatorInfoResponse,
  MusicCreativeChartGetEarlyClearLiveDeckResponse,
  MusicCreativeChartGetEarlyClearRankingInfoResponse,
  MusicCreativeChartGetQuoteTargetChartResponse,
  MusicCreativeChartListByCreatorResponse,
  MusicCreativeChartListPopularCreatorResponse,
  MusicCreativeChartListNewerResponse as MusicCreativeChartListResponse,
} from "../protos/gen/rpc/api/music_creative_chart.gen_pb.js";
