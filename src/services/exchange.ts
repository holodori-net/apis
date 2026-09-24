import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import { decodeProtobuf, encodeProtobuf } from "../protos/codec.js";
import {
  ExchangeListRequestSchema,
  type ExchangeListResponse,
  ExchangeListResponseSchema,
} from "../protos/gen/rpc/api/exchange.gen_pb.js";

const EXCHANGE_LIST: ApiMethod<
  { readonly boothGroupId: string },
  ExchangeListResponse
> = {
  path: "/rpc.api.Exchange/List",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: ({ boothGroupId }) => {
    if (!boothGroupId)
      throw new TypeError("exchange booth group ID must not be empty");
    return encodeProtobuf(ExchangeListRequestSchema, { boothGroupId });
  },
  decode: (data) => decodeProtobuf(ExchangeListResponseSchema, data),
};

/** Provides exchange booth catalogues and account stock state. */
export class ExchangeApi {
  constructor(private readonly client: ApiCaller) {}

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
  ): Promise<ExchangeListResponse> {
    return this.client.call(EXCHANGE_LIST, { boothGroupId }, options);
  }
}

export { EXCHANGE_LIST };
export type * from "../protos/gen/rpc/api/exchange.gen_pb.js";
