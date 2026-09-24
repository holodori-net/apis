import type { UserCard } from "../protos/gen/entity/transaction/user_card.gen_pb.js";

import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import { decodeProtobuf, encodeProtobuf } from "../protos/codec.js";
import { EmptySchema } from "../protos/gen/google/protobuf/empty_pb.js";
import {
  type UserGetResponse,
  UserGetResponseSchema,
} from "../protos/gen/rpc/api/user.gen_pb.js";

const USER_GET: ApiMethod<void, UserGetResponse> = {
  path: "/rpc.api.User/Get",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: false,
  requiresRequestSignature: false,
  encode: () => encodeProtobuf(EmptySchema),
  decode: (response) => decodeProtobuf(UserGetResponseSchema, response),
};

/** Reads the current account's complete user-data response. */
export class UserApi {
  constructor(private readonly client: ApiCaller) {}

  /** Returns the complete User/Get response. @rpc /rpc.api.User/Get */
  get(options?: RequestOptions): Promise<UserGetResponse> {
    return this.client.call(USER_GET, undefined, options);
  }

  /** Returns the cards currently owned by the account. @rpc /rpc.api.User/Get */
  async listCards(options?: RequestOptions): Promise<readonly UserCard[]> {
    return (await this.get(options)).userData?.userCardList ?? [];
  }

  /** Returns the complete User/Get response for compatibility with snapshot callers. @rpc /rpc.api.User/Get */
  getSnapshot(options?: RequestOptions): Promise<UserGetResponse> {
    return this.get(options);
  }
}

export { USER_GET };
export type { UserCard, UserGetResponse };
