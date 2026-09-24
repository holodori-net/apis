import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import { decodeProtobuf, encodeProtobuf } from "../protos/codec.js";
import { EmptySchema } from "../protos/gen/google/protobuf/empty_pb.js";
import {
  type CircuitGetRankingInfoResponse,
  CircuitGetRankingInfoResponseSchema,
} from "../protos/gen/rpc/api/circuit.gen_pb.js";

const CIRCUIT_GET_RANKING_INFO: ApiMethod<void, CircuitGetRankingInfoResponse> =
  {
    path: "/rpc.api.Circuit/GetRankingInfo",
    requiresGameAuth: true,
    requiresMasterVersion: true,
    usesResponseCache: true,
    requiresRequestSignature: false,
    encode: () => encodeProtobuf(EmptySchema),
    decode: (data) => decodeProtobuf(CircuitGetRankingInfoResponseSchema, data),
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
  ): Promise<CircuitGetRankingInfoResponse> {
    return this.client.call(CIRCUIT_GET_RANKING_INFO, undefined, options);
  }
}

export { CIRCUIT_GET_RANKING_INFO };
export type { CircuitGetRankingInfoResponse } from "../protos/gen/rpc/api/circuit.gen_pb.js";
