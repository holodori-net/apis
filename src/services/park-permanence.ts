import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import { decodeProtobuf, encodeProtobuf } from "../protos/codec.js";
import {
  ParkPermanenceListCharacterShopItemRequestSchema,
  type ParkPermanenceListCharacterShopItemResponse,
  ParkPermanenceListCharacterShopItemResponseSchema,
} from "../protos/gen/rpc/api/park_permanence.gen_pb.js";

const PARK_PERMANENCE_LIST_CHARACTER_SHOP_ITEM: ApiMethod<
  { readonly actionNumber: number; readonly parkPermanenceId: string },
  ParkPermanenceListCharacterShopItemResponse
> = {
  path: "/rpc.api.ParkPermanence/ListCharacterShopItem",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: ({ actionNumber, parkPermanenceId }) => {
    if (!parkPermanenceId)
      throw new RangeError("park permanence ID must not be empty");
    if (!Number.isSafeInteger(actionNumber) || actionNumber < 1) {
      throw new RangeError("action number must be a positive integer");
    }
    return encodeProtobuf(ParkPermanenceListCharacterShopItemRequestSchema, {
      parkPermanenceCommonRequestParam: {
        parkPermanenceId,
        actionNumber,
      },
    });
  },
  decode: (data) =>
    decodeProtobuf(ParkPermanenceListCharacterShopItemResponseSchema, data),
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
    request: {
      readonly actionNumber: number;
      readonly parkPermanenceId: string;
    },
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
export type { ParkPermanenceListCharacterShopItemResponse } from "../protos/gen/rpc/api/park_permanence.gen_pb.js";
