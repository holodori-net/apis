import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import {
  decodeProtobuf,
  encodeProtobuf,
  type ProtobufMessageInit,
} from "../protos/codec.js";
import {
  MarathonListMarathonScoreRankingGradeRequestSchema,
  type MarathonListMarathonScoreRankingGradeResponse,
  MarathonListMarathonScoreRankingGradeResponseSchema,
  MarathonListMarathonScoreRankingTopRequestSchema,
  type MarathonListMarathonScoreRankingTopResponse,
  MarathonListMarathonScoreRankingTopResponseSchema,
  MarathonListMusicHighestScoreRankingGradeRequestSchema,
  type MarathonListMusicHighestScoreRankingGradeResponse,
  MarathonListMusicHighestScoreRankingGradeResponseSchema,
  MarathonListMusicHighestScoreRankingTopRequestSchema,
  type MarathonListMusicHighestScoreRankingTopResponse,
  MarathonListMusicHighestScoreRankingTopResponseSchema,
  MarathonListTotalMusicHighestScoreRankingGradeRequestSchema,
  type MarathonListTotalMusicHighestScoreRankingGradeResponse,
  MarathonListTotalMusicHighestScoreRankingGradeResponseSchema,
  MarathonListTotalMusicHighestScoreRankingTopRequestSchema,
  type MarathonListTotalMusicHighestScoreRankingTopResponse,
  MarathonListTotalMusicHighestScoreRankingTopResponseSchema,
  MarathonTopRequestSchema,
  type MarathonTopResponse,
  MarathonTopResponseSchema,
} from "../protos/gen/rpc/api/marathon.gen_pb.js";

export type MarathonTopRequest = ProtobufMessageInit<
  typeof MarathonTopRequestSchema
> & { marathonId: string };
export type MarathonListMusicHighestScoreRankingGradeRequest =
  ProtobufMessageInit<
    typeof MarathonListMusicHighestScoreRankingGradeRequestSchema
  > & { marathonChapterId: string; musicId: string };
export type MarathonListMusicHighestScoreRankingTopRequest =
  ProtobufMessageInit<
    typeof MarathonListMusicHighestScoreRankingTopRequestSchema
  > & { marathonChapterId: string; musicId: string };
export type MarathonListMarathonScoreRankingGradeRequest = ProtobufMessageInit<
  typeof MarathonListMarathonScoreRankingGradeRequestSchema
> & { marathonChapterId: string };
export type MarathonListMarathonScoreRankingTopRequest = ProtobufMessageInit<
  typeof MarathonListMarathonScoreRankingTopRequestSchema
> & { marathonChapterId: string };
export type MarathonListTotalMusicHighestScoreRankingGradeRequest =
  ProtobufMessageInit<
    typeof MarathonListTotalMusicHighestScoreRankingGradeRequestSchema
  > & { marathonChapterId: string };
export type MarathonListTotalMusicHighestScoreRankingTopRequest =
  ProtobufMessageInit<
    typeof MarathonListTotalMusicHighestScoreRankingTopRequestSchema
  > & { marathonChapterId: string };

const MARATHON_TOP: ApiMethod<MarathonTopRequest, MarathonTopResponse> = {
  path: "/rpc.api.Marathon/Top",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: (request) =>
    encodeProtobuf(MarathonTopRequestSchema, {
      marathonId: requireNonEmpty(request.marathonId, "Marathon ID"),
    }),
  decode: (data) => decodeProtobuf(MarathonTopResponseSchema, data),
};

const MARATHON_LIST_MUSIC_HIGHEST_SCORE_RANKING_GRADE: ApiMethod<
  MarathonListMusicHighestScoreRankingGradeRequest,
  MarathonListMusicHighestScoreRankingGradeResponse
> = {
  path: "/rpc.api.Marathon/ListMusicHighestScoreRankingGrade",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: (request) =>
    encodeProtobuf(
      MarathonListMusicHighestScoreRankingGradeRequestSchema,
      validateMusicRankingRequest(request),
    ),
  decode: (data) =>
    decodeProtobuf(
      MarathonListMusicHighestScoreRankingGradeResponseSchema,
      data,
    ),
};

const MARATHON_LIST_MUSIC_HIGHEST_SCORE_RANKING_TOP: ApiMethod<
  MarathonListMusicHighestScoreRankingTopRequest,
  MarathonListMusicHighestScoreRankingTopResponse
> = {
  path: "/rpc.api.Marathon/ListMusicHighestScoreRankingTop",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: (request) =>
    encodeProtobuf(
      MarathonListMusicHighestScoreRankingTopRequestSchema,
      validateMusicRankingRequest(request),
    ),
  decode: (data) =>
    decodeProtobuf(MarathonListMusicHighestScoreRankingTopResponseSchema, data),
};

const MARATHON_LIST_SCORE_RANKING_GRADE: ApiMethod<
  MarathonListMarathonScoreRankingGradeRequest,
  MarathonListMarathonScoreRankingGradeResponse
> = {
  path: "/rpc.api.Marathon/ListMarathonScoreRankingGrade",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: (request) =>
    encodeProtobuf(MarathonListMarathonScoreRankingGradeRequestSchema, {
      marathonChapterId: requireNonEmpty(
        request.marathonChapterId,
        "Marathon chapter ID",
      ),
    }),
  decode: (data) =>
    decodeProtobuf(MarathonListMarathonScoreRankingGradeResponseSchema, data),
};

const MARATHON_LIST_SCORE_RANKING_TOP: ApiMethod<
  MarathonListMarathonScoreRankingTopRequest,
  MarathonListMarathonScoreRankingTopResponse
> = {
  path: "/rpc.api.Marathon/ListMarathonScoreRankingTop",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: (request) =>
    encodeProtobuf(MarathonListMarathonScoreRankingTopRequestSchema, {
      marathonChapterId: requireNonEmpty(
        request.marathonChapterId,
        "Marathon chapter ID",
      ),
    }),
  decode: (data) =>
    decodeProtobuf(MarathonListMarathonScoreRankingTopResponseSchema, data),
};

const MARATHON_LIST_TOTAL_MUSIC_HIGHEST_SCORE_RANKING_GRADE: ApiMethod<
  MarathonListTotalMusicHighestScoreRankingGradeRequest,
  MarathonListTotalMusicHighestScoreRankingGradeResponse
> = {
  path: "/rpc.api.Marathon/ListTotalMusicHighestScoreRankingGrade",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: (request) =>
    encodeProtobuf(
      MarathonListTotalMusicHighestScoreRankingGradeRequestSchema,
      {
        marathonChapterId: requireNonEmpty(
          request.marathonChapterId,
          "Marathon chapter ID",
        ),
      },
    ),
  decode: (data) =>
    decodeProtobuf(
      MarathonListTotalMusicHighestScoreRankingGradeResponseSchema,
      data,
    ),
};

const MARATHON_LIST_TOTAL_MUSIC_HIGHEST_SCORE_RANKING_TOP: ApiMethod<
  MarathonListTotalMusicHighestScoreRankingTopRequest,
  MarathonListTotalMusicHighestScoreRankingTopResponse
> = {
  path: "/rpc.api.Marathon/ListTotalMusicHighestScoreRankingTop",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: (request) =>
    encodeProtobuf(MarathonListTotalMusicHighestScoreRankingTopRequestSchema, {
      marathonChapterId: requireNonEmpty(
        request.marathonChapterId,
        "Marathon chapter ID",
      ),
    }),
  decode: (data) =>
    decodeProtobuf(
      MarathonListTotalMusicHighestScoreRankingTopResponseSchema,
      data,
    ),
};

/** Provides Marathon configuration, public rankings, and ranking results. */
export class MarathonApi {
  constructor(private readonly client: ApiCaller) {}

  /**
   * Returns Marathon metadata, chapters, rewards, bonuses, and account ranks.
   *
   * @rpc /rpc.api.Marathon/Top
   * @remarks The ranking result includes ranks and rewards for the authenticated account.
   */
  async top(
    request: MarathonTopRequest,
    options?: RequestOptions,
  ): Promise<MarathonTopResponse> {
    return this.client.call(MARATHON_TOP, request, options);
  }

  /**
   * Lists music-score ranking grades for a chapter and song.
   *
   * @rpc /rpc.api.Marathon/ListMusicHighestScoreRankingGrade
   * @remarks Each result includes the authenticated account's self rank and score.
   */
  async listMusicHighestScoreRankingGrade(
    request: MarathonListMusicHighestScoreRankingGradeRequest,
    options?: RequestOptions,
  ): Promise<MarathonListMusicHighestScoreRankingGradeResponse> {
    return this.client.call(
      MARATHON_LIST_MUSIC_HIGHEST_SCORE_RANKING_GRADE,
      request,
      options,
    );
  }

  /**
   * Lists top music scores for a chapter and song.
   *
   * @rpc /rpc.api.Marathon/ListMusicHighestScoreRankingTop
   * @remarks Each result includes the authenticated account's self rank and score.
   */
  async listMusicHighestScoreRankingTop(
    request: MarathonListMusicHighestScoreRankingTopRequest,
    options?: RequestOptions,
  ): Promise<MarathonListMusicHighestScoreRankingTopResponse> {
    return this.client.call(
      MARATHON_LIST_MUSIC_HIGHEST_SCORE_RANKING_TOP,
      request,
      options,
    );
  }

  /**
   * Lists Marathon score ranking grades for a chapter.
   *
   * @rpc /rpc.api.Marathon/ListMarathonScoreRankingGrade
   * @remarks Each result includes the authenticated account's self rank and score.
   */
  async listMarathonScoreRankingGrade(
    request: MarathonListMarathonScoreRankingGradeRequest,
    options?: RequestOptions,
  ): Promise<MarathonListMarathonScoreRankingGradeResponse> {
    return this.client.call(
      MARATHON_LIST_SCORE_RANKING_GRADE,
      request,
      options,
    );
  }

  /**
   * Lists top Marathon scores for a chapter.
   *
   * @rpc /rpc.api.Marathon/ListMarathonScoreRankingTop
   * @remarks Each result includes the authenticated account's self rank and score.
   */
  async listMarathonScoreRankingTop(
    request: MarathonListMarathonScoreRankingTopRequest,
    options?: RequestOptions,
  ): Promise<MarathonListMarathonScoreRankingTopResponse> {
    return this.client.call(MARATHON_LIST_SCORE_RANKING_TOP, request, options);
  }

  /**
   * Lists total music-score ranking grades for a chapter.
   *
   * @rpc /rpc.api.Marathon/ListTotalMusicHighestScoreRankingGrade
   * @remarks Each result includes the authenticated account's self rank and score.
   */
  async listTotalMusicHighestScoreRankingGrade(
    request: MarathonListTotalMusicHighestScoreRankingGradeRequest,
    options?: RequestOptions,
  ): Promise<MarathonListTotalMusicHighestScoreRankingGradeResponse> {
    return this.client.call(
      MARATHON_LIST_TOTAL_MUSIC_HIGHEST_SCORE_RANKING_GRADE,
      request,
      options,
    );
  }

  /**
   * Lists top total music scores for a chapter.
   *
   * @rpc /rpc.api.Marathon/ListTotalMusicHighestScoreRankingTop
   * @remarks Each result includes the authenticated account's self rank and score.
   */
  async listTotalMusicHighestScoreRankingTop(
    request: MarathonListTotalMusicHighestScoreRankingTopRequest,
    options?: RequestOptions,
  ): Promise<MarathonListTotalMusicHighestScoreRankingTopResponse> {
    return this.client.call(
      MARATHON_LIST_TOTAL_MUSIC_HIGHEST_SCORE_RANKING_TOP,
      request,
      options,
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
  MarathonListMarathonScoreRankingGradeResponse,
  MarathonListMarathonScoreRankingTopResponse,
  MarathonListMusicHighestScoreRankingGradeResponse,
  MarathonListMusicHighestScoreRankingTopResponse,
  MarathonListTotalMusicHighestScoreRankingGradeResponse,
  MarathonListTotalMusicHighestScoreRankingTopResponse,
  MarathonTopResponse,
} from "../protos/gen/rpc/api/marathon.gen_pb.js";

function requireNonEmpty(value: string, name: string): string {
  if (value.length === 0) throw new RangeError(`${name} must not be empty`);
  return value;
}

function validateMusicRankingRequest(request: {
  readonly marathonChapterId: string;
  readonly musicId: string;
}) {
  return {
    marathonChapterId: requireNonEmpty(
      request.marathonChapterId,
      "Marathon chapter ID",
    ),
    musicId: requireNonEmpty(request.musicId, "music ID"),
  };
}
