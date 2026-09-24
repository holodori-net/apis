import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import { decodeProtobuf, encodeProtobuf } from "../protos/codec.js";
import { EmptySchema } from "../protos/gen/google/protobuf/empty_pb.js";
import {
  type JumpRopeGetRankingInfoResponse,
  JumpRopeGetRankingInfoResponseSchema,
} from "../protos/gen/rpc/api/jump_rope.gen_pb.js";

const JUMP_ROPE_GET_RANKING_INFO: ApiMethod<
  void,
  JumpRopeGetRankingInfoResponse
> = {
  path: "/rpc.api.JumpRope/GetRankingInfo",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: () => encodeProtobuf(EmptySchema),
  decode: (data) => decodeProtobuf(JumpRopeGetRankingInfoResponseSchema, data),
};

/** Reads Jump Rope public information. */
export class JumpRopeApi {
  constructor(private readonly client: ApiCaller) {}

  /**
   * Returns the Jump Rope leaderboard.
   * @rpc /rpc.api.JumpRope/GetRankingInfo
   * @remarks The response also includes the authenticated account's self rank.
   */
  async getRankingInfo(
    options?: RequestOptions,
  ): Promise<JumpRopeGetRankingInfoResponse> {
    return this.client.call(JUMP_ROPE_GET_RANKING_INFO, undefined, options);
  }
}

export { JUMP_ROPE_GET_RANKING_INFO };
export type { JumpRopeGetRankingInfoResponse } from "../protos/gen/rpc/api/jump_rope.gen_pb.js";
