import {
  decodeNoticeGetResponse,
  decodeNoticeListInCategoryResponse,
  decodeNoticeTopResponse,
  decodeUpdateResponse,
  encodeNoticeGetRequest,
  encodeNoticeListInCategoryRequest,
  encodeNoticeTopRequest,
  encodeStringListRequest,
  type NoticeCategory,
  type NoticeGetResponse,
  type NoticeInfo,
  type NoticeListInCategoryResponse,
  type NoticeTopResponse,
  type NoticeUpdateResponse,
} from "../codecs/notice.js";
import { type ApiClient } from "../core/client.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";

const NOTICE_TOP: ApiMethod<void, NoticeTopResponse> = {
  path: "/rpc.api.Notice/Top",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeNoticeTopRequest,
  decode: decodeNoticeTopResponse,
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
  encode: ({ categoryId, offset }) =>
    encodeNoticeListInCategoryRequest(categoryId, offset),
  decode: decodeNoticeListInCategoryResponse,
};

const NOTICE_GET: ApiMethod<{ readonly noticeId: string }, NoticeGetResponse> =
  {
    path: "/rpc.api.Notice/Get",
    requiresGameAuth: true,
    requiresMasterVersion: true,
    usesResponseCache: true,
    requiresRequestSignature: false,
    encode: ({ noticeId }) => encodeNoticeGetRequest(noticeId),
    decode: decodeNoticeGetResponse,
  };

const NOTICE_UPDATE_CATEGORY_READ_TIME: ApiMethod<
  readonly string[],
  NoticeUpdateResponse
> = {
  path: "/rpc.api.Notice/UpdateCategoryReadTime",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: (categoryIds) =>
    encodeStringListRequest(categoryIds, "notice category IDs"),
  decode: decodeUpdateResponse,
};

const NOTICE_UPDATE_DETAIL_READ_TIME: ApiMethod<
  readonly string[],
  NoticeUpdateResponse
> = {
  path: "/rpc.api.Notice/UpdateDetailReadTime",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: (noticeIds) => encodeStringListRequest(noticeIds, "notice IDs"),
  decode: decodeUpdateResponse,
};

/** Reads localized public notices and manages account-specific read timestamps. */
export class NoticeApi {
  constructor(
    private readonly client: ApiClient,
    private readonly ensureAuthenticated: () => Promise<unknown>,
  ) {}

  /** Returns notice categories and their current summaries. @rpc /rpc.api.Notice/Top */
  async top(options?: RequestOptions): Promise<NoticeTopResponse> {
    await this.ensureAuthenticated();
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
    await this.ensureAuthenticated();
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
    await this.ensureAuthenticated();
    return this.client.call(NOTICE_GET, { noticeId }, options);
  }

  /** Updates category read timestamps for the current account. @remarks This method changes account read state. @rpc /rpc.api.Notice/UpdateCategoryReadTime */
  updateCategoryReadTime(
    categoryIds: readonly string[],
    options?: RequestOptions,
  ): Promise<NoticeUpdateResponse> {
    return this.updateCategoryReadTimeAuthenticated(categoryIds, options);
  }

  private async updateCategoryReadTimeAuthenticated(
    categoryIds: readonly string[],
    options?: RequestOptions,
  ): Promise<NoticeUpdateResponse> {
    await this.ensureAuthenticated();
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
  ): Promise<NoticeUpdateResponse> {
    return this.updateDetailReadTimeAuthenticated(noticeIds, options);
  }

  private async updateDetailReadTimeAuthenticated(
    noticeIds: readonly string[],
    options?: RequestOptions,
  ): Promise<NoticeUpdateResponse> {
    await this.ensureAuthenticated();
    return this.client.call(NOTICE_UPDATE_DETAIL_READ_TIME, noticeIds, options);
  }
}

export type { NoticeCategory, NoticeGetResponse, NoticeInfo };
