import {
  decodeMiniGameRankingResponse,
  encodeMiniGameRankingRequest,
  type MiniGameRankingResponse,
} from "../codecs/mini-game-ranking.js";
import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";

const CIRCUIT_GET_RANKING_INFO: ApiMethod<void, MiniGameRankingResponse> = {
  path: "/rpc.api.Circuit/GetRankingInfo",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeMiniGameRankingRequest,
  decode: decodeMiniGameRankingResponse,
};

/** Reads Circuit public information. */
export class CircuitApi {
  constructor(private readonly client: ApiCaller) {}

  /**
   * Returns the Circuit leaderboard.
   * @rpc /rpc.api.Circuit/GetRankingInfo
   * @remarks The response also includes the authenticated account's self rank.
   */
  async getRankingInfo(
    options?: RequestOptions,
  ): Promise<MiniGameRankingResponse> {
    return this.client.call(CIRCUIT_GET_RANKING_INFO, undefined, options);
  }
}

export { CIRCUIT_GET_RANKING_INFO };
