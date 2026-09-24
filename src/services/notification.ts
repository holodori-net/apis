import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import { decodeProtobuf, encodeProtobuf } from "../protos/codec.js";
import { EmptySchema } from "../protos/gen/google/protobuf/empty_pb.js";
import {
  type NotificationListResponse,
  NotificationListResponseSchema,
} from "../protos/gen/rpc/api/notification.gen_pb.js";

const NOTIFICATION_LIST: ApiMethod<void, NotificationListResponse> = {
  path: "/rpc.api.Notification/List",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: () => encodeProtobuf(EmptySchema),
  decode: (data) => decodeProtobuf(NotificationListResponseSchema, data),
};

/** Provides account-level unread and content update indicators. */
export class NotificationApi {
  constructor(private readonly client: ApiCaller) {}

  /**
   * Returns unread and update flags for the authenticated account, including
   * any updated Park exchange booth groups.
   *
   * @rpc /rpc.api.Notification/List
   */
  async list(options?: RequestOptions): Promise<NotificationListResponse> {
    return this.client.call(NOTIFICATION_LIST, undefined, options);
  }
}

export { NOTIFICATION_LIST };
export type { NotificationListResponse } from "../protos/gen/rpc/api/notification.gen_pb.js";
