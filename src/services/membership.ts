import {
  decodeMembershipGetShopResponse,
  encodeMembershipGetShopRequest,
  type ShopInfo,
} from "../codecs/shop.js";
import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";

const MEMBERSHIP_GET_SHOP: ApiMethod<void, ShopInfo> = {
  path: "/rpc.api.Membership/GetShop",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeMembershipGetShopRequest,
  decode: decodeMembershipGetShopResponse,
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
  async getShop(options?: RequestOptions): Promise<ShopInfo> {
    return this.client.call(MEMBERSHIP_GET_SHOP, undefined, options);
  }
}

export { MEMBERSHIP_GET_SHOP };
export type { ShopInfo } from "../codecs/shop.js";
