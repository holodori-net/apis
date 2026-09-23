import {
  decodeMiniGameRankingResponse,
  encodeMiniGameRankingRequest,
  type MiniGameRankingResponse,
} from "../codecs/mini-game-ranking.js";
import { type ApiClient } from "../core/client.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";

const SPLASH_BALL_GET_RANKING_INFO: ApiMethod<void, MiniGameRankingResponse> = {
  path: "/rpc.api.SplashBall/GetRankingInfo",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeMiniGameRankingRequest,
  decode: decodeMiniGameRankingResponse,
};

/** Reads Splash Ball public information. */
export class SplashBallApi {
  constructor(
    private readonly client: ApiClient,
    private readonly ensureAuthenticated: () => Promise<unknown>,
  ) {}

  /**
   * Returns the Splash Ball leaderboard.
   * @rpc /rpc.api.SplashBall/GetRankingInfo
   * @remarks The response also includes the authenticated account's self rank.
   */
  async getRankingInfo(
    options?: RequestOptions,
  ): Promise<MiniGameRankingResponse> {
    await this.ensureAuthenticated();
    return this.client.call(SPLASH_BALL_GET_RANKING_INFO, undefined, options);
  }
}

export { SPLASH_BALL_GET_RANKING_INFO };
