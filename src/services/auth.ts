import { type ApiClient } from "../core/client.js";
import { HolodoriApiError } from "../core/errors.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import { requireResponseString } from "../core/response.js";
import { type ApiSession } from "../core/session.js";
import { decodeProtobuf, encodeProtobuf } from "../protos/codec.js";
import { EmptySchema } from "../protos/gen/google/protobuf/empty_pb.js";
import {
  type AuthCreateResponse,
  AuthCreateResponseSchema,
  AuthLoginRequestSchema,
  type AuthLoginResponse,
  AuthLoginResponseSchema,
} from "../protos/gen/rpc/api/auth.gen_pb.js";

const AUTH_CREATE: ApiMethod<void, AuthCreateResponse> = {
  path: "/rpc.api.Auth/Create",
  requiresGameAuth: false,
  requiresMasterVersion: false,
  usesResponseCache: false,
  requiresRequestSignature: false,
  encode: () => encodeProtobuf(EmptySchema),
  decode: (response) => decodeProtobuf(AuthCreateResponseSchema, response),
};

const AUTH_LOGIN: ApiMethod<string, AuthLoginResponse> = {
  path: "/rpc.api.Auth/Login",
  requiresGameAuth: false,
  requiresMasterVersion: false,
  usesResponseCache: false,
  requiresRequestSignature: false,
  encode: (credential) =>
    encodeProtobuf(AuthLoginRequestSchema, { credential }),
  decode: (response) => decodeProtobuf(AuthLoginResponseSchema, response),
};

/** Manages persistent credentials and authenticated game sessions. */
export class AuthApi {
  constructor(
    private readonly client: ApiClient,
    private readonly session: ApiSession,
  ) {}

  /** Creates a new anonymous account and stores its persistent credential. @remarks Stores the returned credential in this SDK session. @rpc /rpc.api.Auth/Create */
  async create(options?: RequestOptions): Promise<AuthCreateResponse> {
    const response = await this.client.call(AUTH_CREATE, undefined, options);
    this.session.setCredential(
      requireResponseString(
        response.credential,
        "credential",
        AUTH_CREATE.path,
      ),
    );
    return response;
  }

  /** Logs in with a persistent credential and stores the returned game auth token. @remarks Stores the credential and token in this SDK session. @rpc /rpc.api.Auth/Login */
  async login(
    credential: string | undefined = this.session.credentialValue,
    options?: RequestOptions,
  ): Promise<AuthLoginResponse> {
    if (!credential)
      throw new HolodoriApiError(
        "credential is required for Auth/Login",
        AUTH_LOGIN.path,
      );
    const response = await this.client.call(AUTH_LOGIN, credential, options);
    this.session.setCredential(credential);
    this.session.setGameAuthToken(
      requireResponseString(
        response.gameAuthToken,
        "game auth token",
        AUTH_LOGIN.path,
      ),
    );
    return response;
  }
}

export { AUTH_CREATE, AUTH_LOGIN };
export type { AuthCreateResponse, AuthLoginResponse };
