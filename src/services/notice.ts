import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import { decodeProtobuf, encodeProtobuf } from "../protos/codec.js";
import { EmptySchema } from "../protos/gen/google/protobuf/empty_pb.js";
import {
  NoticeGetRequestSchema,
  type NoticeGetResponse,
  NoticeGetResponseSchema,
  NoticeListInCategoryRequestSchema,
  type NoticeListInCategoryResponse,
  NoticeListInCategoryResponseSchema,
  type NoticeTopResponse,
  NoticeTopResponseSchema,
  NoticeUpdateCategoryReadTimeRequestSchema,
  type NoticeUpdateCategoryReadTimeResponse,
  NoticeUpdateCategoryReadTimeResponseSchema,
  NoticeUpdateDetailReadTimeRequestSchema,
  type NoticeUpdateDetailReadTimeResponse,
  NoticeUpdateDetailReadTimeResponseSchema,
} from "../protos/gen/rpc/api/notice.gen_pb.js";

const NOTICE_TOP: ApiMethod<void, NoticeTopResponse> = {
  path: "/rpc.api.Notice/Top",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: () => encodeProtobuf(EmptySchema),
  decode: (data) => decodeProtobuf(NoticeTopResponseSchema, data),
};

const NOTICE_LIST_IN_CATEGORY: ApiMethod<
  { readonly categoryId: string; readonly offset: number },
  NoticeListInCategoryResponse
> = {
  path: "/rpc.api.Notice/ListInCategory",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: ({ categoryId, offset }) => {
    requireNonEmpty(categoryId, "notice category ID");
    if (!Number.isInteger(offset) || offset < 0) {
      throw new RangeError(
        "notice category offset must be a non-negative integer",
      );
    }
    return encodeProtobuf(NoticeListInCategoryRequestSchema, {
      noticeCategoryId: categoryId,
      offset,
    });
  },
  decode: (data) => decodeProtobuf(NoticeListInCategoryResponseSchema, data),
};

const NOTICE_GET: ApiMethod<{ readonly noticeId: string }, NoticeGetResponse> =
  {
    path: "/rpc.api.Notice/Get",
    requiresGameAuth: true,
    requiresMasterVersion: true,
    usesResponseCache: true,
    requiresRequestSignature: false,
    encode: ({ noticeId }) =>
      encodeProtobuf(NoticeGetRequestSchema, {
        noticeId: requireNonEmpty(noticeId, "notice ID"),
      }),
    decode: (data) => decodeProtobuf(NoticeGetResponseSchema, data),
  };

const NOTICE_UPDATE_CATEGORY_READ_TIME: ApiMethod<
  readonly string[],
  NoticeUpdateCategoryReadTimeResponse
> = {
  path: "/rpc.api.Notice/UpdateCategoryReadTime",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: (categoryIds) =>
    encodeProtobuf(NoticeUpdateCategoryReadTimeRequestSchema, {
      noticeCategoryIds: validateIds(categoryIds, "notice category IDs"),
    }),
  decode: (data) =>
    decodeProtobuf(NoticeUpdateCategoryReadTimeResponseSchema, data),
};

const NOTICE_UPDATE_DETAIL_READ_TIME: ApiMethod<
  readonly string[],
  NoticeUpdateDetailReadTimeResponse
> = {
  path: "/rpc.api.Notice/UpdateDetailReadTime",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: (noticeIds) =>
    encodeProtobuf(NoticeUpdateDetailReadTimeRequestSchema, {
      noticeIds: validateIds(noticeIds, "notice IDs"),
    }),
  decode: (data) =>
    decodeProtobuf(NoticeUpdateDetailReadTimeResponseSchema, data),
};

/** Reads localized public notices and manages account-specific read timestamps. */
export class NoticeApi {
  constructor(private readonly client: ApiCaller) {}

  /** Returns notice categories and their current summaries. @rpc /rpc.api.Notice/Top */
  async top(options?: RequestOptions): Promise<NoticeTopResponse> {
    return this.client.call(NOTICE_TOP, undefined, options);
  }

  /** Lists one notice category with offset-based pagination. @rpc /rpc.api.Notice/ListInCategory */
  listInCategory(
    categoryId: string,
    offset: number,
    options?: RequestOptions,
  ): Promise<NoticeListInCategoryResponse> {
    return this.listInCategoryAuthenticated(categoryId, offset, options);
  }

  private async listInCategoryAuthenticated(
    categoryId: string,
    offset: number,
    options?: RequestOptions,
  ): Promise<NoticeListInCategoryResponse> {
    return this.client.call(
      NOTICE_LIST_IN_CATEGORY,
      { categoryId, offset },
      options,
    );
  }

  /** Returns the localized detail body for one notice. @rpc /rpc.api.Notice/Get */
  async get(
    noticeId: string,
    options?: RequestOptions,
  ): Promise<NoticeGetResponse> {
    return this.client.call(NOTICE_GET, { noticeId }, options);
  }

  /** Updates category read timestamps for the current account. @remarks This method changes account read state. @rpc /rpc.api.Notice/UpdateCategoryReadTime */
  updateCategoryReadTime(
    categoryIds: readonly string[],
    options?: RequestOptions,
  ): Promise<NoticeUpdateCategoryReadTimeResponse> {
    return this.updateCategoryReadTimeAuthenticated(categoryIds, options);
  }

  private async updateCategoryReadTimeAuthenticated(
    categoryIds: readonly string[],
    options?: RequestOptions,
  ): Promise<NoticeUpdateCategoryReadTimeResponse> {
    return this.client.call(
      NOTICE_UPDATE_CATEGORY_READ_TIME,
      categoryIds,
      options,
    );
  }

  /** Updates notice-detail read timestamps for the current account. @remarks This method changes account read state. @rpc /rpc.api.Notice/UpdateDetailReadTime */
  updateDetailReadTime(
    noticeIds: readonly string[],
    options?: RequestOptions,
  ): Promise<NoticeUpdateDetailReadTimeResponse> {
    return this.updateDetailReadTimeAuthenticated(noticeIds, options);
  }

  private async updateDetailReadTimeAuthenticated(
    noticeIds: readonly string[],
    options?: RequestOptions,
  ): Promise<NoticeUpdateDetailReadTimeResponse> {
    return this.client.call(NOTICE_UPDATE_DETAIL_READ_TIME, noticeIds, options);
  }
}

export type {
  NoticeGetResponse,
  NoticeInfo,
  NoticeListInCategoryResponse,
  NoticeTopResponse,
  NoticeUpdateCategoryReadTimeResponse,
  NoticeUpdateDetailReadTimeResponse,
} from "../protos/gen/rpc/api/notice.gen_pb.js";

function requireNonEmpty(value: string, name: string): string {
  if (value.length === 0) throw new RangeError(`${name} must not be empty`);
  return value;
}

function validateIds(values: readonly string[], name: string): string[] {
  if (values.length === 0) throw new RangeError(`${name} must not be empty`);
  if (new Set(values).size !== values.length)
    throw new RangeError(`${name} must be unique`);
  return values.map((value) => requireNonEmpty(value, name));
}
