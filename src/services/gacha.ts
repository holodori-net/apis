import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import { decodeProtobuf, encodeProtobuf } from "../protos/codec.js";
import { EmptySchema } from "../protos/gen/google/protobuf/empty_pb.js";
import {
  GachaListCardSelectProbabilityRequestSchema,
  type GachaListCardSelectProbabilityResponse,
  GachaListCardSelectProbabilityResponseSchema,
  GachaListNormalProbabilityRequestSchema,
  type GachaListNormalProbabilityResponse,
  GachaListNormalProbabilityResponseSchema,
  type GachaListResponse,
  GachaListResponseSchema,
} from "../protos/gen/rpc/api/gacha.gen_pb.js";

const GACHA_LIST: ApiMethod<void, GachaListResponse> = {
  path: "/rpc.api.Gacha/List",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: () => encodeProtobuf(EmptySchema),
  decode: (data) => decodeProtobuf(GachaListResponseSchema, data),
};

const GACHA_LIST_NORMAL_PROBABILITY: ApiMethod<
  { readonly gachaId: string },
  GachaListNormalProbabilityResponse
> = {
  path: "/rpc.api.Gacha/ListNormalProbability",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: ({ gachaId }) => {
    if (!gachaId) throw new TypeError("Gacha ID must not be empty");
    return encodeProtobuf(GachaListNormalProbabilityRequestSchema, { gachaId });
  },
  decode: (data) =>
    decodeProtobuf(GachaListNormalProbabilityResponseSchema, data),
};

const GACHA_LIST_CARD_SELECT_PROBABILITY: ApiMethod<
  { readonly gachaId: string },
  GachaListCardSelectProbabilityResponse
> = {
  path: "/rpc.api.Gacha/ListCardSelectProbability",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: ({ gachaId }) => {
    if (!gachaId) throw new TypeError("Gacha ID must not be empty");
    return encodeProtobuf(GachaListCardSelectProbabilityRequestSchema, {
      gachaId,
    });
  },
  decode: (data) =>
    decodeProtobuf(GachaListCardSelectProbabilityResponseSchema, data),
};

/** Provides Gacha banners, draw configuration, and probabilities. */
export class GachaApi {
  constructor(private readonly client: ApiCaller) {}

  /**
   * Lists Gacha groups and their active configurations, costs, rewards, and
   * card selection options. Lock, read-time, draw-count, and selected-card
   * fields describe the authenticated account.
   *
   * @rpc /rpc.api.Gacha/List
   */
  async list(options?: RequestOptions): Promise<GachaListResponse> {
    return this.client.call(GACHA_LIST, undefined, options);
  }

  /**
   * Lists ordinary-draw rarity and card probabilities for one Gacha.
   * Probabilities are returned as integer parts per ten million.
   *
   * @rpc /rpc.api.Gacha/ListNormalProbability
   */
  async listNormalProbability(
    gachaId: string,
    options?: RequestOptions,
  ): Promise<GachaListNormalProbabilityResponse> {
    return this.client.call(
      GACHA_LIST_NORMAL_PROBABILITY,
      { gachaId },
      options,
    );
  }

  /**
   * Lists card-select draw rarity and card probabilities for one Gacha.
   * Probabilities are returned as integer parts per ten million.
   *
   * @rpc /rpc.api.Gacha/ListCardSelectProbability
   * @remarks The server may reject the request until the authenticated account
   * has selected cards for the Gacha.
   */
  async listCardSelectProbability(
    gachaId: string,
    options?: RequestOptions,
  ): Promise<GachaListCardSelectProbabilityResponse> {
    return this.client.call(
      GACHA_LIST_CARD_SELECT_PROBABILITY,
      { gachaId },
      options,
    );
  }
}

export {
  GACHA_LIST,
  GACHA_LIST_CARD_SELECT_PROBABILITY,
  GACHA_LIST_NORMAL_PROBABILITY,
};
export type * from "../protos/gen/rpc/api/gacha.gen_pb.js";
