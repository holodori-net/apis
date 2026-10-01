import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import {
  decodeProtobuf,
  encodeProtobuf,
  type ProtobufMessageInit,
} from "../protos/codec.js";
import { GiftSortType as ProtoGiftSortType } from "../protos/gen/enums/gift_sort_type.gen_pb.js";
import { EmptySchema } from "../protos/gen/google/protobuf/empty_pb.js";
import {
  type GiftItem,
  type GiftListHistoryResponse,
  type GiftListHistoryResponse_GiftHistoryItem,
  GiftListHistoryResponseSchema,
  GiftListRequestSchema,
  type GiftListResponse,
  GiftListResponseSchema,
  type GiftTopResponse,
  GiftTopResponseSchema,
} from "../protos/gen/rpc/api/gift.gen_pb.js";

/** Gift ordering accepted by Gift/List. */
export const GiftSortType = {
  PostedTime: ProtoGiftSortType.POSTED_TIME,
  LimitTime: ProtoGiftSortType.LIMIT_TIME,
} as const;
export type GiftSortType = ProtoGiftSortType;

export type GiftListRequest = Required<
  Pick<
    ProtobufMessageInit<typeof GiftListRequestSchema>,
    "isDesc" | "offset" | "sortType"
  >
>;

const GIFT_LIST: ApiMethod<GiftListRequest, GiftListResponse> = {
  path: "/rpc.api.Gift/List",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: (request) => {
    if (
      !Number.isInteger(request.offset) ||
      request.offset < 0 ||
      request.offset > 2_147_483_647
    ) {
      throw new RangeError("offset must be a non-negative int32");
    }
    if (
      request.sortType !== GiftSortType.PostedTime &&
      request.sortType !== GiftSortType.LimitTime
    ) {
      throw new RangeError("sortType must be PostedTime or LimitTime");
    }
    if (typeof request.isDesc !== "boolean")
      throw new TypeError("isDesc must be a boolean");
    return encodeProtobuf(GiftListRequestSchema, request);
  },
  decode: (data) => decodeProtobuf(GiftListResponseSchema, data),
};

const GIFT_TOP: ApiMethod<void, GiftTopResponse> = {
  path: "/rpc.api.Gift/Top",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: () => encodeProtobuf(EmptySchema),
  decode: (data) => decodeProtobuf(GiftTopResponseSchema, data),
};

const GIFT_LIST_HISTORY: ApiMethod<void, GiftListHistoryResponse> = {
  path: "/rpc.api.Gift/ListHistory",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: () => encodeProtobuf(EmptySchema),
  decode: (data) => decodeProtobuf(GiftListHistoryResponseSchema, data),
};

/** Provides access to the authenticated account's gift box. */
export class GiftApi {
  constructor(private readonly client: ApiCaller) {}

  /** Lists the authenticated account's current gift box overview.
   *
   * @rpc /rpc.api.Gift/Top
   * @remarks Includes account-specific unread announcement count.
   */
  async top(options?: RequestOptions): Promise<GiftTopResponse> {
    return this.client.call(GIFT_TOP, undefined, options);
  }

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

  /** Lists the authenticated account's gift opening history.
   *
   * @rpc /rpc.api.Gift/ListHistory
   * @remarks History records reflect gifts opened by the authenticated account.
   */
  async listHistory(
    options?: RequestOptions,
  ): Promise<GiftListHistoryResponse> {
    return this.client.call(GIFT_LIST_HISTORY, undefined, options);
  }
}

export { GIFT_LIST, GIFT_LIST_HISTORY, GIFT_TOP };
export type {
  GiftItem,
  GiftListHistoryResponse,
  GiftListHistoryResponse_GiftHistoryItem,
  GiftListResponse,
  GiftTopResponse,
};
