import {
  decodeMembershipGetShopResponse,
  encodeMembershipGetShopRequest,
  type ShopInfo,
} from "../codecs/shop.js";
import { type ApiClient } from "../core/client.js";
import { type ApiMethod } from "../core/method.js";

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
  constructor(
    private readonly client: ApiClient,
    private readonly ensureAuthenticated: () => Promise<unknown>,
  ) {}

  /**
   * Returns the Membership shop catalogue, including subscription product IDs,
   * stone quantities, rewards, and subscription duration type. The unlocked
   * and subscribed flags reflect the authenticated account.
   *
   * @rpc /rpc.api.Membership/GetShop
   * @returns The Membership shop visible to the authenticated account.
   */
  async getShop(): Promise<ShopInfo> {
    await this.ensureAuthenticated();
    return this.client.call(MEMBERSHIP_GET_SHOP, undefined);
  }
}

export { MEMBERSHIP_GET_SHOP };
export type { ShopInfo } from "../codecs/shop.js";
