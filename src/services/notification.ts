import {
  decodeNotificationListResponse,
  encodeNotificationListRequest,
  type NotificationListResponse,
} from "../codecs/notification.js";
import { type ApiClient } from "../core/client.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";

const NOTIFICATION_LIST: ApiMethod<void, NotificationListResponse> = {
  path: "/rpc.api.Notification/List",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeNotificationListRequest,
  decode: decodeNotificationListResponse,
};

/** Provides account-level unread and content update indicators. */
export class NotificationApi {
  constructor(
    private readonly client: ApiClient,
    private readonly ensureAuthenticated: () => Promise<unknown>,
  ) {}

  /**
   * Returns unread and update flags for the authenticated account, including
   * any updated Park exchange booth groups.
   *
   * @rpc /rpc.api.Notification/List
   */
  async list(options?: RequestOptions): Promise<NotificationListResponse> {
    await this.ensureAuthenticated();
    return this.client.call(NOTIFICATION_LIST, undefined, options);
  }
}

export { NOTIFICATION_LIST };
export type {
  NotificationListResponse,
  ParkNotificationInfo,
  UpdatedExchangeBoothGroup,
} from "../codecs/notification.js";
