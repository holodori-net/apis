import {
  decodeHomeLoginResponse,
  encodeHomeLoginRequest,
  type HomeLoginResponse,
} from "../codecs/home.js";
import { type ApiClient } from "../core/client.js";
import { type ApiMethod } from "../core/method.js";

const HOME_LOGIN: ApiMethod<void, HomeLoginResponse> = {
  path: "/rpc.api.Home/Login",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeHomeLoginRequest,
  decode: decodeHomeLoginResponse,
};

export class HomeApi {
  constructor(
    private readonly client: ApiClient,
    private readonly ensureAuthenticated: () => Promise<unknown>,
  ) {}

  async login(): Promise<HomeLoginResponse> {
    await this.ensureAuthenticated();
    return this.client.call(HOME_LOGIN, undefined);
  }
}

export { HOME_LOGIN };
export type {
  HomeLoginResponse,
  HomeRealtimeNotificationConnectionInfo,
} from "../codecs/home.js";
