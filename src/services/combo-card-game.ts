import {
  type ComboCardGameListUserInfoRequest,
  type ComboCardGameListUserInfoResponse,
  decodeComboCardGameListUserInfoResponse,
  encodeComboCardGameListUserInfoRequest,
} from "../codecs/combo-card-game.js";
import {
  decodeMiniGameRankingResponse,
  encodeMiniGameRankingRequest,
  type MiniGameRankingResponse,
} from "../codecs/mini-game-ranking.js";
import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";

const COMBO_CARD_GAME_GET_RANKING_INFO: ApiMethod<
  void,
  MiniGameRankingResponse
> = {
  path: "/rpc.api.ComboCardGame/GetRankingInfo",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeMiniGameRankingRequest,
  decode: decodeMiniGameRankingResponse,
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
  encode: encodeComboCardGameListUserInfoRequest,
  decode: decodeComboCardGameListUserInfoResponse,
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
  ): Promise<MiniGameRankingResponse> {
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
