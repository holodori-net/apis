import {
  decodeCredentialResponse,
  decodeGameAuthTokenResponse,
  encodeAuthCreateRequest,
  encodeAuthLoginRequest,
} from "../codecs/auth.js";
import { type ApiClient, HolodoriApiError } from "../core/client.js";
import { type ApiMethod } from "../core/method.js";
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

export class AuthApi {
  constructor(
    private readonly client: ApiClient,
    private readonly session: ApiSession,
  ) {}

  async create(): Promise<string> {
    const credential = await this.client.call(AUTH_CREATE, undefined);
    this.session.setCredential(credential);
    return credential;
  }

  async login(credential = this.session.credentialValue): Promise<string> {
    if (!credential)
      throw new HolodoriApiError(
        "credential is required for Auth/Login",
        AUTH_LOGIN.path,
      );
    const token = await this.client.call(AUTH_LOGIN, credential);
    this.session.setCredential(credential);
    this.session.setGameAuthToken(token);
    return token;
  }
}

export { AUTH_CREATE, AUTH_LOGIN };
