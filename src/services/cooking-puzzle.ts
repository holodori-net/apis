import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import { decodeProtobuf, encodeProtobuf } from "../protos/codec.js";
import { EmptySchema } from "../protos/gen/google/protobuf/empty_pb.js";
import {
  type CookingPuzzleGetRankingInfoResponse,
  CookingPuzzleGetRankingInfoResponseSchema,
} from "../protos/gen/rpc/api/cooking_puzzle.gen_pb.js";

const COOKING_PUZZLE_GET_RANKING_INFO: ApiMethod<
  void,
  CookingPuzzleGetRankingInfoResponse
> = {
  path: "/rpc.api.CookingPuzzle/GetRankingInfo",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: () => encodeProtobuf(EmptySchema),
  decode: (data) =>
    decodeProtobuf(CookingPuzzleGetRankingInfoResponseSchema, data),
};

/** Reads Cooking Puzzle public information. */
export class CookingPuzzleApi {
  constructor(private readonly client: ApiCaller) {}

  /**
   * Returns the Cooking Puzzle leaderboard.
   * @rpc /rpc.api.CookingPuzzle/GetRankingInfo
   * @remarks The response also includes the authenticated account's self rank.
   */
  async getRankingInfo(
    options?: RequestOptions,
  ): Promise<CookingPuzzleGetRankingInfoResponse> {
    return this.client.call(
      COOKING_PUZZLE_GET_RANKING_INFO,
      undefined,
      options,
    );
  }
}

export { COOKING_PUZZLE_GET_RANKING_INFO };
export type { CookingPuzzleGetRankingInfoResponse } from "../protos/gen/rpc/api/cooking_puzzle.gen_pb.js";
