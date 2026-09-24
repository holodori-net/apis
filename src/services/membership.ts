import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import { decodeProtobuf, encodeProtobuf } from "../protos/codec.js";
import { EmptySchema } from "../protos/gen/google/protobuf/empty_pb.js";
import {
  type MembershipGetShopResponse,
  MembershipGetShopResponseSchema,
} from "../protos/gen/rpc/api/membership.gen_pb.js";

const MEMBERSHIP_GET_SHOP: ApiMethod<void, MembershipGetShopResponse> = {
  path: "/rpc.api.Membership/GetShop",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: () => encodeProtobuf(EmptySchema),
  decode: (data) => decodeProtobuf(MembershipGetShopResponseSchema, data),
};

/** Provides the Membership subscription shop. */
export class MembershipApi {
  constructor(private readonly client: ApiCaller) {}

  /**
   * Returns the Membership shop catalogue, including subscription product IDs,
   * stone quantities, rewards, and subscription duration type. The unlocked
   * and subscribed flags reflect the authenticated account.
   *
   * @rpc /rpc.api.Membership/GetShop
   * @returns The Membership shop visible to the authenticated account.
   */
  async getShop(options?: RequestOptions): Promise<MembershipGetShopResponse> {
    return this.client.call(MEMBERSHIP_GET_SHOP, undefined, options);
  }
}

export { MEMBERSHIP_GET_SHOP };
export type { MembershipGetShopResponse } from "../protos/gen/rpc/api/membership.gen_pb.js";
