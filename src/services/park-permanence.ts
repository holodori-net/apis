import {
  decodeParkPermanenceListCharacterShopItemResponse,
  encodeParkPermanenceListCharacterShopItemRequest,
  type ParkPermanenceListCharacterShopItemRequest,
  type ParkPermanenceListCharacterShopItemResponse,
} from "../codecs/park-permanence.js";
import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";

const PARK_PERMANENCE_LIST_CHARACTER_SHOP_ITEM: ApiMethod<
  ParkPermanenceListCharacterShopItemRequest,
  ParkPermanenceListCharacterShopItemResponse
> = {
  path: "/rpc.api.ParkPermanence/ListCharacterShopItem",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeParkPermanenceListCharacterShopItemRequest,
  decode: decodeParkPermanenceListCharacterShopItemResponse,
};

/** Provides the authenticated account's Park character shop catalogue. */
export class ParkPermanenceApi {
  constructor(private readonly client: ApiCaller) {}

  /**
   * Lists the shop name, cost, available items, collection flags, and selected
   * items for a Park permanence.
   *
   * @rpc /rpc.api.ParkPermanence/ListCharacterShopItem
   * @param request Park permanence ID and positive action sequence number.
   * @returns The shop catalogue as returned for the authenticated account.
   */
  async listCharacterShopItem(
    request: ParkPermanenceListCharacterShopItemRequest,
    options?: RequestOptions,
  ): Promise<ParkPermanenceListCharacterShopItemResponse> {
    return this.client.call(
      PARK_PERMANENCE_LIST_CHARACTER_SHOP_ITEM,
      request,
      options,
    );
  }
}

export { PARK_PERMANENCE_LIST_CHARACTER_SHOP_ITEM };
export type {
  ParkPermanenceCharacterShopItem,
  ParkPermanenceCharacterShopItemWithCollectedInfo,
  ParkPermanenceConsumption,
  ParkPermanenceListCharacterShopItemRequest,
  ParkPermanenceListCharacterShopItemResponse,
  ParkPermanenceReward,
} from "../codecs/park-permanence.js";
