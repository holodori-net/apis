import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import {
  decodeProtobuf,
  encodeProtobuf,
  type ProtobufMessageInit,
} from "../protos/codec.js";
import { EmptySchema } from "../protos/gen/google/protobuf/empty_pb.js";
import {
  type ComboCardGameGetRankingInfoResponse,
  ComboCardGameGetRankingInfoResponseSchema,
  ComboCardGameListUserInfoRequestSchema,
  type ComboCardGameListUserInfoResponse,
  ComboCardGameListUserInfoResponseSchema,
} from "../protos/gen/rpc/api/combo_card_game.gen_pb.js";

export type ComboCardGameListUserInfoRequest = ProtobufMessageInit<
  typeof ComboCardGameListUserInfoRequestSchema
> & {
  readonly publicUserIds: readonly string[];
};

const COMBO_CARD_GAME_GET_RANKING_INFO: ApiMethod<
  void,
  ComboCardGameGetRankingInfoResponse
> = {
  path: "/rpc.api.ComboCardGame/GetRankingInfo",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: () => encodeProtobuf(EmptySchema),
  decode: (data) =>
    decodeProtobuf(ComboCardGameGetRankingInfoResponseSchema, data),
};

const COMBO_CARD_GAME_LIST_USER_INFO: ApiMethod<
  ComboCardGameListUserInfoRequest,
  ComboCardGameListUserInfoResponse
> = {
  path: "/rpc.api.ComboCardGame/ListUserInfo",
  requiresGameAuth: true,
  requiresMasterVersion: false,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: (request) => {
    if (request.publicUserIds.length === 0) {
      throw new RangeError(
        "publicUserIds must contain at least one public user ID",
      );
    }
    if (request.publicUserIds.some((id) => id.length === 0)) {
      throw new RangeError(
        "publicUserIds must not contain empty public user IDs",
      );
    }
    return encodeProtobuf(ComboCardGameListUserInfoRequestSchema, request);
  },
  decode: (data) =>
    decodeProtobuf(ComboCardGameListUserInfoResponseSchema, data),
};

/** Reads Combo Card Game public information. */
export class ComboCardGameApi {
  constructor(private readonly client: ApiCaller) {}

  /**
   * Returns the Combo Card Game leaderboard.
   * @rpc /rpc.api.ComboCardGame/GetRankingInfo
   * @remarks The response also includes the authenticated account's self rank.
   */
  async getRankingInfo(
    options?: RequestOptions,
  ): Promise<ComboCardGameGetRankingInfoResponse> {
    return this.client.call(
      COMBO_CARD_GAME_GET_RANKING_INFO,
      undefined,
      options,
    );
  }

  /**
   * Returns public Combo Card Game statistics for the requested users.
   * @rpc /rpc.api.ComboCardGame/ListUserInfo
   * @remarks A private room ID may be supplied to request room-specific user information.
   */
  async listUserInfo(
    request: ComboCardGameListUserInfoRequest,
    options?: RequestOptions,
  ): Promise<ComboCardGameListUserInfoResponse> {
    return this.client.call(COMBO_CARD_GAME_LIST_USER_INFO, request, options);
  }
}

export { COMBO_CARD_GAME_GET_RANKING_INFO, COMBO_CARD_GAME_LIST_USER_INFO };
export type {
  ComboCardGameGetRankingInfoResponse,
  ComboCardGameListUserInfoResponse,
} from "../protos/gen/rpc/api/combo_card_game.gen_pb.js";
