import {
  decodeEventListEventInfoForPortalResponse,
  decodeEventListEventInfoResponse,
  encodeEventListEventInfoForPortalRequest,
  encodeEventListEventInfoRequest,
  type EventListEventInfoForPortalResponse,
  type EventListEventInfoResponse,
} from "../codecs/event.js";
import { type ApiClient } from "../core/client.js";
import { type ApiMethod } from "../core/method.js";

const EVENT_LIST_EVENT_INFO: ApiMethod<void, EventListEventInfoResponse> = {
  path: "/rpc.api.Event/ListEventInfo",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeEventListEventInfoRequest,
  decode: decodeEventListEventInfoResponse,
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
  encode: encodeEventListEventInfoForPortalRequest,
  decode: decodeEventListEventInfoForPortalResponse,
};

/** Provides current event definitions and portal summaries. */
export class EventApi {
  constructor(
    private readonly client: ApiClient,
    private readonly ensureAuthenticated: () => Promise<unknown>,
  ) {}

  /**
   * Lists full event configuration, including Marathon chapters, rewards,
   * ranking rewards, and score bonuses. Requires an authenticated session;
   * event definitions are not personalized to the account.
   *
   * @rpc /rpc.api.Event/ListEventInfo
   */
  async listEventInfo(): Promise<EventListEventInfoResponse> {
    await this.ensureAuthenticated();
    return this.client.call(EVENT_LIST_EVENT_INFO, undefined);
  }

  /**
   * Lists portal event summaries with names, schedule, assets, and mission
   * references. Requires an authenticated session; the returned event list is
   * not personalized to the account.
   *
   * @rpc /rpc.api.Event/ListEventInfoForPortal
   */
  async listEventInfoForPortal(): Promise<EventListEventInfoForPortalResponse> {
    await this.ensureAuthenticated();
    return this.client.call(EVENT_LIST_EVENT_INFO_FOR_PORTAL, undefined);
  }
}

export { EVENT_LIST_EVENT_INFO, EVENT_LIST_EVENT_INFO_FOR_PORTAL };
export type {
  EventInfo,
  EventListEventInfoForPortalResponse,
  EventListEventInfoResponse,
  EventLiveScoreBonus,
  EventMarathonChapter,
  EventMarathonInfo,
  EventMarathonScoreReward,
  EventMiniGameScoreBonus,
  EventMiniGameScoreRate,
  EventMusicRankReward,
  EventMusicScoreBonus,
  EventPortalInfo,
  EventRankReward,
  EventReward,
} from "../codecs/event.js";
