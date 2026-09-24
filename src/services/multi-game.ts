import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import { decodeProtobuf, encodeProtobuf } from "../protos/codec.js";
import { EmptySchema } from "../protos/gen/google/protobuf/empty_pb.js";
import {
  type MultiGameListPingServerResponse,
  MultiGameListPingServerResponseSchema,
} from "../protos/gen/rpc/api/multi_game.gen_pb.js";

const MULTI_GAME_LIST_PING_SERVER: ApiMethod<
  void,
  MultiGameListPingServerResponse
> = {
  path: "/rpc.api.MultiGame/ListPingServer",
  requiresGameAuth: true,
  requiresMasterVersion: false,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: () => encodeProtobuf(EmptySchema),
  decode: (data) => decodeProtobuf(MultiGameListPingServerResponseSchema, data),
};

/** Provides multiplayer connection discovery. */
export class MultiGameApi {
  constructor(private readonly client: ApiCaller) {}

  /** Lists server regions and endpoints used for multiplayer ping checks.
   *
   * @rpc /rpc.api.MultiGame/ListPingServer
   */
  async listPingServer(
    options?: RequestOptions,
  ): Promise<MultiGameListPingServerResponse> {
    return this.client.call(MULTI_GAME_LIST_PING_SERVER, undefined, options);
  }
}

export { MULTI_GAME_LIST_PING_SERVER };
export type { MultiGameListPingServerResponse } from "../protos/gen/rpc/api/multi_game.gen_pb.js";
