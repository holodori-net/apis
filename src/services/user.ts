import {
  type AccountCard,
  decodeUserGetResponse,
  encodeUserGetRequest,
  type UserDataSnapshot,
  type UserGetResponse,
} from "../codecs/user.js";
import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";

const USER_GET: ApiMethod<void, UserGetResponse> = {
  path: "/rpc.api.User/Get",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: false,
  requiresRequestSignature: false,
  encode: encodeUserGetRequest,
  decode: decodeUserGetResponse,
};

/** Reads the current account's user-data snapshot. */
export class UserApi {
  constructor(private readonly client: ApiCaller) {}

  /** Returns the cards currently owned by the account. @rpc /rpc.api.User/Get */
  async listCards(options?: RequestOptions): Promise<readonly AccountCard[]> {
    return (await this.client.call(USER_GET, undefined, options)).cards;
  }

  /** Returns decoded card, character, deck, music, item, and skill-tree state. @rpc /rpc.api.User/Get */
  async getSnapshot(options?: RequestOptions): Promise<UserDataSnapshot> {
    return this.client.call(USER_GET, undefined, options);
  }
}

export { USER_GET };
export type { AccountCard, UserDataSnapshot, UserGetResponse };
