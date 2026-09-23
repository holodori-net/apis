import {
  decodeCredentialResponse,
  decodeGameAuthTokenResponse,
  encodeAuthCreateRequest,
  encodeAuthLoginRequest,
} from "../codecs/auth.js";
import { type ApiClient } from "../core/client.js";
import { HolodoriApiError } from "../core/errors.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import { type ApiSession } from "../core/session.js";

const AUTH_CREATE: ApiMethod<void, string> = {
  path: "/rpc.api.Auth/Create",
  requiresGameAuth: false,
  requiresMasterVersion: false,
  usesResponseCache: false,
  requiresRequestSignature: false,
  encode: encodeAuthCreateRequest,
  decode: decodeCredentialResponse,
};

const AUTH_LOGIN: ApiMethod<string, string> = {
  path: "/rpc.api.Auth/Login",
  requiresGameAuth: false,
  requiresMasterVersion: false,
  usesResponseCache: false,
  requiresRequestSignature: false,
  encode: encodeAuthLoginRequest,
  decode: decodeGameAuthTokenResponse,
};

/** Manages persistent credentials and authenticated game sessions. */
export class AuthApi {
  constructor(
    private readonly client: ApiClient,
    private readonly session: ApiSession,
  ) {}

  /** Creates a new anonymous account and stores its persistent credential. @rpc /rpc.api.Auth/Create */
  async create(options?: RequestOptions): Promise<string> {
    const credential = await this.client.call(AUTH_CREATE, undefined, options);
    this.session.setCredential(credential);
    return credential;
  }

  /** Logs in with a persistent credential and stores the returned game auth token. @rpc /rpc.api.Auth/Login */
  async login(
    credential: string | undefined = this.session.credentialValue,
    options?: RequestOptions,
  ): Promise<string> {
    if (!credential)
      throw new HolodoriApiError(
        "credential is required for Auth/Login",
        AUTH_LOGIN.path,
      );
    const token = await this.client.call(AUTH_LOGIN, credential, options);
    this.session.setCredential(credential);
    this.session.setGameAuthToken(token);
    return token;
  }
}

export { AUTH_CREATE, AUTH_LOGIN };
