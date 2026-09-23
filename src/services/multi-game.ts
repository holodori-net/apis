import {
  decodeMultiGameListPingServerResponse,
  encodeMultiGameListPingServerRequest,
  type MultiGameListPingServerResponse,
} from "../codecs/multi-game.js";
import { type ApiClient } from "../core/client.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";

const MULTI_GAME_LIST_PING_SERVER: ApiMethod<
  void,
  MultiGameListPingServerResponse
> = {
  path: "/rpc.api.MultiGame/ListPingServer",
  requiresGameAuth: true,
  requiresMasterVersion: false,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeMultiGameListPingServerRequest,
  decode: decodeMultiGameListPingServerResponse,
};

/** Provides multiplayer connection discovery. */
export class MultiGameApi {
  constructor(
    private readonly client: ApiClient,
    private readonly ensureAuthenticated: () => Promise<unknown>,
  ) {}

  /** Lists server regions and endpoints used for multiplayer ping checks.
   *
   * @rpc /rpc.api.MultiGame/ListPingServer
   */
  async listPingServer(
    options?: RequestOptions,
  ): Promise<MultiGameListPingServerResponse> {
    await this.ensureAuthenticated();
    return this.client.call(MULTI_GAME_LIST_PING_SERVER, undefined, options);
  }
}

export { MULTI_GAME_LIST_PING_SERVER };
export type {
  MultiGameListPingServerResponse,
  MultiGamePingServer,
} from "../codecs/multi-game.js";
