import {
  decodeMiniGameRankingResponse,
  encodeMiniGameRankingRequest,
  type MiniGameRankingResponse,
} from "../codecs/mini-game-ranking.js";
import { type ApiClient } from "../core/client.js";
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

/** Reads Combo Card Game public information. */
export class ComboCardGameApi {
  constructor(
    private readonly client: ApiClient,
    private readonly ensureAuthenticated: () => Promise<unknown>,
  ) {}

  /**
   * Returns the Combo Card Game leaderboard.
   * @rpc /rpc.api.ComboCardGame/GetRankingInfo
   * @remarks The response also includes the authenticated account's self rank.
   */
  async getRankingInfo(
    options?: RequestOptions,
  ): Promise<MiniGameRankingResponse> {
    await this.ensureAuthenticated();
    return this.client.call(
      COMBO_CARD_GAME_GET_RANKING_INFO,
      undefined,
      options,
    );
  }
}

export { COMBO_CARD_GAME_GET_RANKING_INFO };
