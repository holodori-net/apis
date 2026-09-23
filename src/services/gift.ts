import {
  decodeGiftListResponse,
  encodeGiftListRequest,
  type GiftListRequest,
  type GiftListResponse,
} from "../codecs/gift.js";
import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";

const GIFT_LIST: ApiMethod<GiftListRequest, GiftListResponse> = {
  path: "/rpc.api.Gift/List",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeGiftListRequest,
  decode: decodeGiftListResponse,
};

/** Provides access to the authenticated account's gift box. */
export class GiftApi {
  constructor(private readonly client: ApiCaller) {}

  /** Lists gifts using the requested sort order and offset.
   *
   * @rpc /rpc.api.Gift/List
   */
  async list(
    request: GiftListRequest,
    options?: RequestOptions,
  ): Promise<GiftListResponse> {
    return this.client.call(GIFT_LIST, request, options);
  }
}

export { GIFT_LIST };
export { GiftSortType } from "../codecs/gift.js";
export type {
  GiftItem,
  GiftListRequest,
  GiftListResponse,
} from "../codecs/gift.js";
