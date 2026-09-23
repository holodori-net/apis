import {
  decodeShopListResponse,
  encodeShopListRequest,
  type ShopResponse,
} from "../codecs/shop.js";
import { type ApiClient } from "../core/client.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";

const SHOP_LIST: ApiMethod<void, ShopResponse> = {
  path: "/rpc.api.Shop/List",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeShopListRequest,
  decode: decodeShopListResponse,
};

/** Provides the authenticated account's visible shop catalogue. */
export class ShopApi {
  constructor(
    private readonly client: ApiClient,
    private readonly ensureAuthenticated: () => Promise<unknown>,
  ) {}

  /**
   * Lists the shops and their current catalogue, including costs, rewards,
   * purchase limits, reset times, and platform product identifiers.
   * Availability, purchase counts, new-item flags, and subscription state are
   * specific to the authenticated account.
   *
   * @rpc /rpc.api.Shop/List
   * @returns The shops visible to the authenticated account.
   */
  async list(options?: RequestOptions): Promise<ShopResponse> {
    await this.ensureAuthenticated();
    return this.client.call(SHOP_LIST, undefined, options);
  }
}

export { SHOP_LIST };
export type {
  ShopChargeItem,
  ShopChargeItemConsumable,
  ShopChargeItemSubscription,
  ShopConsumption,
  ShopConsumptionItem,
  ShopInfo,
  ShopItem,
  ShopResponse,
  ShopReward,
} from "../codecs/shop.js";
