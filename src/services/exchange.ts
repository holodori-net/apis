import {
  decodeExchangeListResponse,
  encodeExchangeListRequest,
  type ExchangeResponse,
} from "../codecs/exchange.js";
import { type ApiClient } from "../core/client.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";

const EXCHANGE_LIST: ApiMethod<
  { readonly boothGroupId: string },
  ExchangeResponse
> = {
  path: "/rpc.api.Exchange/List",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: ({ boothGroupId }) => encodeExchangeListRequest(boothGroupId),
  decode: decodeExchangeListResponse,
};

/** Provides exchange booth catalogues and account stock state. */
export class ExchangeApi {
  constructor(
    private readonly client: ApiClient,
    private readonly ensureAuthenticated: () => Promise<unknown>,
  ) {}

  /**
   * Lists a single exchange booth group, including booth metadata, item costs,
   * rewards, stock limits, reset schedule, and release/expiry times. Purchased
   * quantities and unlock flags are specific to the authenticated account.
   *
   * @rpc /rpc.api.Exchange/List
   * @param boothGroupId Master-data booth group ID to query.
   * @returns The exchange group as visible to the authenticated account.
   */
  async list(
    boothGroupId: string,
    options?: RequestOptions,
  ): Promise<ExchangeResponse> {
    await this.ensureAuthenticated();
    return this.client.call(EXCHANGE_LIST, { boothGroupId }, options);
  }
}

export { EXCHANGE_LIST };
export type {
  ExchangeBooth,
  ExchangeConsumption,
  ExchangeItem,
  ExchangeResponse,
} from "../codecs/exchange.js";
