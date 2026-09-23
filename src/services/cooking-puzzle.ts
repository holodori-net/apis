import {
  decodeMiniGameRankingResponse,
  encodeMiniGameRankingRequest,
  type MiniGameRankingResponse,
} from "../codecs/mini-game-ranking.js";
import { type ApiClient } from "../core/client.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";

const COOKING_PUZZLE_GET_RANKING_INFO: ApiMethod<
  void,
  MiniGameRankingResponse
> = {
  path: "/rpc.api.CookingPuzzle/GetRankingInfo",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeMiniGameRankingRequest,
  decode: decodeMiniGameRankingResponse,
};

/** Reads Cooking Puzzle public information. */
export class CookingPuzzleApi {
  constructor(
    private readonly client: ApiClient,
    private readonly ensureAuthenticated: () => Promise<unknown>,
  ) {}

  /**
   * Returns the Cooking Puzzle leaderboard.
   * @rpc /rpc.api.CookingPuzzle/GetRankingInfo
   * @remarks The response also includes the authenticated account's self rank.
   */
  async getRankingInfo(
    options?: RequestOptions,
  ): Promise<MiniGameRankingResponse> {
    await this.ensureAuthenticated();
    return this.client.call(
      COOKING_PUZZLE_GET_RANKING_INFO,
      undefined,
      options,
    );
  }
}

export { COOKING_PUZZLE_GET_RANKING_INFO };
