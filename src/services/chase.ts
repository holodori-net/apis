import {
  type ChaseRankingRequest,
  decodeMiniGameRankingResponse,
  encodeChaseRankingRequest,
  type MiniGameRankingResponse,
} from "../codecs/mini-game-ranking.js";
import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";

const CHASE_GET_RANKING_INFO: ApiMethod<
  ChaseRankingRequest,
  MiniGameRankingResponse
> = {
  path: "/rpc.api.Chase/GetRankingInfo",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeChaseRankingRequest,
  decode: decodeMiniGameRankingResponse,
};

/** Reads Chase public information. */
export class ChaseApi {
  constructor(private readonly client: ApiCaller) {}

  /**
   * Returns the Chase leaderboard for a team category.
   * @rpc /rpc.api.Chase/GetRankingInfo
   * @remarks The response also includes the authenticated account's self rank.
   */
  async getRankingInfo(
    request: ChaseRankingRequest,
    options?: RequestOptions,
  ): Promise<MiniGameRankingResponse> {
    return this.client.call(CHASE_GET_RANKING_INFO, request, options);
  }
}

export { CHASE_GET_RANKING_INFO };
