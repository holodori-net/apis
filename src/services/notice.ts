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

export class NoticeApi {
  constructor(
    private readonly client: ApiClient,
    private readonly ensureAuthenticated: () => Promise<unknown>,
  ) {}

  async top(): Promise<NoticeTopResponse> {
    await this.ensureAuthenticated();
    return this.client.call(NOTICE_TOP, undefined);
  }

  listInCategory(
    categoryId: string,
    offset: number,
  ): Promise<NoticeListInCategoryResponse> {
    return this.listInCategoryAuthenticated(categoryId, offset);
  }

  private async listInCategoryAuthenticated(
    categoryId: string,
    offset: number,
  ): Promise<NoticeListInCategoryResponse> {
    await this.ensureAuthenticated();
    return this.client.call(NOTICE_LIST_IN_CATEGORY, { categoryId, offset });
  }

  async get(noticeId: string): Promise<NoticeGetResponse> {
    await this.ensureAuthenticated();
    return this.client.call(NOTICE_GET, { noticeId });
  }

  updateCategoryReadTime(
    categoryIds: readonly string[],
  ): Promise<NoticeUpdateResponse> {
    return this.updateCategoryReadTimeAuthenticated(categoryIds);
  }

  private async updateCategoryReadTimeAuthenticated(
    categoryIds: readonly string[],
  ): Promise<NoticeUpdateResponse> {
    await this.ensureAuthenticated();
    return this.client.call(NOTICE_UPDATE_CATEGORY_READ_TIME, categoryIds);
  }

  updateDetailReadTime(
    noticeIds: readonly string[],
  ): Promise<NoticeUpdateResponse> {
    return this.updateDetailReadTimeAuthenticated(noticeIds);
  }

  private async updateDetailReadTimeAuthenticated(
    noticeIds: readonly string[],
  ): Promise<NoticeUpdateResponse> {
    await this.ensureAuthenticated();
    return this.client.call(NOTICE_UPDATE_DETAIL_READ_TIME, noticeIds);
  }
}

export type { NoticeCategory, NoticeGetResponse, NoticeInfo };
