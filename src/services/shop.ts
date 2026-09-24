import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import { decodeProtobuf, encodeProtobuf } from "../protos/codec.js";
import { EmptySchema } from "../protos/gen/google/protobuf/empty_pb.js";
import {
  type ShopListResponse,
  ShopListResponseSchema,
} from "../protos/gen/rpc/api/shop.gen_pb.js";

export type ShopResponse = ShopListResponse;

const SHOP_LIST: ApiMethod<void, ShopListResponse> = {
  path: "/rpc.api.Shop/List",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: () => encodeProtobuf(EmptySchema),
  decode: (data) => decodeProtobuf(ShopListResponseSchema, data),
};

/** Provides the authenticated account's visible shop catalogue. */
export class ShopApi {
  constructor(private readonly client: ApiCaller) {}

  /**
   * Lists the shops and their current catalogue, including costs, rewards,
   * purchase limits, reset times, and platform product identifiers.
   * Availability, purchase counts, new-item flags, and subscription state are
   * specific to the authenticated account.
   *
   * @rpc /rpc.api.Shop/List
   * @returns The shops visible to the authenticated account.
   */
  async list(options?: RequestOptions): Promise<ShopListResponse> {
    return this.client.call(SHOP_LIST, undefined, options);
  }
}

export { SHOP_LIST };
export type { Consumption as ShopConsumption } from "../protos/gen/common/consumption.gen_pb.js";
export type { Reward as ShopReward } from "../protos/gen/common/reward.gen_pb.js";
export type {
  Shop_ChargeItem as ShopChargeItem,
  Shop_ChargeItemConsumable as ShopChargeItemConsumable,
  Shop_ChargeItemSubscription as ShopChargeItemSubscription,
  Shop_ConsumptionItem as ShopConsumptionItem,
  Shop as ShopInfo,
  Shop_Item as ShopItem,
} from "../protos/gen/rpc/api/common/shop.gen_pb.js";
export type { ShopListResponse } from "../protos/gen/rpc/api/shop.gen_pb.js";
