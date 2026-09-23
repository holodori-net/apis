import {
  decodeMiniGameRankingResponse,
  encodeMiniGameRankingRequest,
  type MiniGameRankingResponse,
} from "../codecs/mini-game-ranking.js";
import { type ApiClient } from "../core/client.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";

const JUMP_ROPE_GET_RANKING_INFO: ApiMethod<void, MiniGameRankingResponse> = {
  path: "/rpc.api.JumpRope/GetRankingInfo",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeMiniGameRankingRequest,
  decode: decodeMiniGameRankingResponse,
};

/** Reads Jump Rope public information. */
export class JumpRopeApi {
  constructor(
    private readonly client: ApiClient,
    private readonly ensureAuthenticated: () => Promise<unknown>,
  ) {}

  /**
   * Returns the Jump Rope leaderboard.
   * @rpc /rpc.api.JumpRope/GetRankingInfo
   * @remarks The response also includes the authenticated account's self rank.
   */
  async getRankingInfo(
    options?: RequestOptions,
  ): Promise<MiniGameRankingResponse> {
    await this.ensureAuthenticated();
    return this.client.call(JUMP_ROPE_GET_RANKING_INFO, undefined, options);
  }
}

export { JUMP_ROPE_GET_RANKING_INFO };
