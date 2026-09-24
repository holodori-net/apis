import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import { decodeProtobuf, encodeProtobuf } from "../protos/codec.js";
import { EmptySchema } from "../protos/gen/google/protobuf/empty_pb.js";
import {
  type EventListEventInfoForPortalResponse,
  EventListEventInfoForPortalResponseSchema,
  type EventListEventInfoResponse,
  EventListEventInfoResponseSchema,
} from "../protos/gen/rpc/api/event.gen_pb.js";

const EVENT_LIST_EVENT_INFO: ApiMethod<void, EventListEventInfoResponse> = {
  path: "/rpc.api.Event/ListEventInfo",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: () => encodeProtobuf(EmptySchema),
  decode: (data) => decodeProtobuf(EventListEventInfoResponseSchema, data),
};

const EVENT_LIST_EVENT_INFO_FOR_PORTAL: ApiMethod<
  void,
  EventListEventInfoForPortalResponse
> = {
  path: "/rpc.api.Event/ListEventInfoForPortal",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: () => encodeProtobuf(EmptySchema),
  decode: (data) =>
    decodeProtobuf(EventListEventInfoForPortalResponseSchema, data),
};

/** Provides current event definitions and portal summaries. */
export class EventApi {
  constructor(private readonly client: ApiCaller) {}

  /**
   * Lists full event configuration, including Marathon chapters, rewards,
   * ranking rewards, and score bonuses. Requires an authenticated session;
   * event definitions are not personalized to the account.
   *
   * @rpc /rpc.api.Event/ListEventInfo
   */
  async listEventInfo(
    options?: RequestOptions,
  ): Promise<EventListEventInfoResponse> {
    return this.client.call(EVENT_LIST_EVENT_INFO, undefined, options);
  }

  /**
   * Lists portal event summaries with names, schedule, assets, and mission
   * references. Requires an authenticated session; the returned event list is
   * not personalized to the account.
   *
   * @rpc /rpc.api.Event/ListEventInfoForPortal
   */
  async listEventInfoForPortal(
    options?: RequestOptions,
  ): Promise<EventListEventInfoForPortalResponse> {
    return this.client.call(
      EVENT_LIST_EVENT_INFO_FOR_PORTAL,
      undefined,
      options,
    );
  }
}

export { EVENT_LIST_EVENT_INFO, EVENT_LIST_EVENT_INFO_FOR_PORTAL };
export type * from "../protos/gen/rpc/api/event.gen_pb.js";
