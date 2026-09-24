import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import { decodeProtobuf, encodeProtobuf } from "../protos/codec.js";
import { EmptySchema } from "../protos/gen/google/protobuf/empty_pb.js";
import {
  type SplashBallGetRankingInfoResponse,
  SplashBallGetRankingInfoResponseSchema,
} from "../protos/gen/rpc/api/splash_ball.gen_pb.js";

const SPLASH_BALL_GET_RANKING_INFO: ApiMethod<
  void,
  SplashBallGetRankingInfoResponse
> = {
  path: "/rpc.api.SplashBall/GetRankingInfo",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: () => encodeProtobuf(EmptySchema),
  decode: (data) =>
    decodeProtobuf(SplashBallGetRankingInfoResponseSchema, data),
};

/** Reads Splash Ball public information. */
export class SplashBallApi {
  constructor(private readonly client: ApiCaller) {}

  /**
   * Returns the Splash Ball leaderboard.
   * @rpc /rpc.api.SplashBall/GetRankingInfo
   * @remarks The response also includes the authenticated account's self rank.
   */
  async getRankingInfo(
    options?: RequestOptions,
  ): Promise<SplashBallGetRankingInfoResponse> {
    return this.client.call(SPLASH_BALL_GET_RANKING_INFO, undefined, options);
  }
}

export { SPLASH_BALL_GET_RANKING_INFO };
export type { SplashBallGetRankingInfoResponse } from "../protos/gen/rpc/api/splash_ball.gen_pb.js";
