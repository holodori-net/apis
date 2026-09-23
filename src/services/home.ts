import {
  decodeHomeLoginResponse,
  encodeHomeLoginRequest,
  type HomeLoginResponse,
} from "../codecs/home.js";
import { type ApiClient } from "../core/client.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";

const HOME_LOGIN: ApiMethod<void, HomeLoginResponse> = {
  path: "/rpc.api.Home/Login",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeHomeLoginRequest,
  decode: decodeHomeLoginResponse,
};

/** Completes the authenticated home bootstrap before gameplay API calls. */
export class HomeApi {
  constructor(
    private readonly client: ApiClient,
    private readonly ensureAuthenticated: () => Promise<unknown>,
  ) {}

  /** Enters the home session and applies server-side rollover processing. @rpc /rpc.api.Home/Login */
  async login(options?: RequestOptions): Promise<HomeLoginResponse> {
    await this.ensureAuthenticated();
    return this.client.call(HOME_LOGIN, undefined, options);
  }
}

export { HOME_LOGIN };
export type {
  HomeLoginResponse,
  HomeRealtimeNotificationConnectionInfo,
} from "../codecs/home.js";
