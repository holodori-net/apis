import {
  type AccountCard,
  decodeUserGetResponse,
  encodeUserGetRequest,
  type UserDataSnapshot,
  type UserGetResponse,
} from "../codecs/user.js";
import { type ApiClient } from "../core/client.js";
import { type ApiMethod } from "../core/method.js";

const USER_GET: ApiMethod<void, UserGetResponse> = {
  path: "/rpc.api.User/Get",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: false,
  requiresRequestSignature: false,
  encode: encodeUserGetRequest,
  decode: decodeUserGetResponse,
};

export class UserApi {
  constructor(
    private readonly client: ApiClient,
    private readonly ensureAuthenticated: () => Promise<unknown>,
  ) {}

  async listCards(): Promise<readonly AccountCard[]> {
    await this.ensureAuthenticated();
    return (await this.client.call(USER_GET, undefined)).cards;
  }

  async getSnapshot(): Promise<UserDataSnapshot> {
    await this.ensureAuthenticated();
    return this.client.call(USER_GET, undefined);
  }
}

export { USER_GET };
export type { AccountCard, UserDataSnapshot, UserGetResponse };
