import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import {
  decodeProtobuf,
  encodeProtobuf,
  type ProtobufMessageInit,
} from "../protos/codec.js";
import { ChaseTeamType } from "../protos/gen/enums/chase_team_type.gen_pb.js";
import {
  ChaseGetRankingInfoRequestSchema,
  type ChaseGetRankingInfoResponse,
  ChaseGetRankingInfoResponseSchema,
} from "../protos/gen/rpc/api/chase.gen_pb.js";

export type ChaseRankingRequest = ProtobufMessageInit<
  typeof ChaseGetRankingInfoRequestSchema
> & {
  readonly chaseTeamType: ChaseTeamType;
};

const CHASE_GET_RANKING_INFO: ApiMethod<
  ChaseRankingRequest,
  ChaseGetRankingInfoResponse
> = {
  path: "/rpc.api.Chase/GetRankingInfo",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: ({ chaseTeamType }) => {
    if (
      chaseTeamType !== ChaseTeamType.MISCHIEF &&
      chaseTeamType !== ChaseTeamType.PATROL
    ) {
      throw new RangeError("chaseTeamType must be Mischief or Patrol");
    }
    return encodeProtobuf(ChaseGetRankingInfoRequestSchema, { chaseTeamType });
  },
  decode: (data) => decodeProtobuf(ChaseGetRankingInfoResponseSchema, data),
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
  ): Promise<ChaseGetRankingInfoResponse> {
    return this.client.call(CHASE_GET_RANKING_INFO, request, options);
  }
}

export { CHASE_GET_RANKING_INFO };
export { ChaseTeamType };
export type { ChaseGetRankingInfoResponse } from "../protos/gen/rpc/api/chase.gen_pb.js";
