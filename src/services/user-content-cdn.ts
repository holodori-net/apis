import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import { decodeProtobuf, encodeProtobuf } from "../protos/codec.js";
import { EmptySchema } from "../protos/gen/google/protobuf/empty_pb.js";
import {
  type UserContentCdnGetSignedCookieResponse,
  UserContentCdnGetSignedCookieResponseSchema,
} from "../protos/gen/rpc/api/user_content_cdn.gen_pb.js";

const USER_CONTENT_CDN_GET_SIGNED_COOKIE: ApiMethod<
  void,
  UserContentCdnGetSignedCookieResponse
> = {
  path: "/rpc.api.UserContentCdn/GetSignedCookie",
  requiresGameAuth: true,
  requiresMasterVersion: false,
  usesResponseCache: false,
  requiresRequestSignature: false,
  encode: () => encodeProtobuf(EmptySchema),
  decode: (data) =>
    decodeProtobuf(UserContentCdnGetSignedCookieResponseSchema, data),
};

/** Provides signed cookies for accessing user content on the CDN. */
export class UserContentCdnApi {
  constructor(private readonly client: ApiCaller) {}

  /** Returns the signed cookie used to access user content on the CDN.
   *
   * @rpc /rpc.api.UserContentCdn/GetSignedCookie
   */
  async getSignedCookie(
    options?: RequestOptions,
  ): Promise<UserContentCdnGetSignedCookieResponse> {
    return this.client.call(
      USER_CONTENT_CDN_GET_SIGNED_COOKIE,
      undefined,
      options,
    );
  }
}

export { USER_CONTENT_CDN_GET_SIGNED_COOKIE };
export type { UserContentCdnGetSignedCookieResponse } from "../protos/gen/rpc/api/user_content_cdn.gen_pb.js";
