import {
  decodeSystemGetSystemInfoResponse,
  encodeSystemGetSystemInfoRequest,
  type SystemGetSystemInfoResponse,
} from "../codecs/system.js";
import { type ApiClient, HolodoriApiError } from "../core/client.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import { type ApiSession } from "../core/session.js";

const SYSTEM_GET_SYSTEM_INFO: ApiMethod<
  { readonly credential: string },
  SystemGetSystemInfoResponse
> = {
  path: "/rpc.api.System/GetSystemInfo",
  requiresGameAuth: false,
  requiresMasterVersion: false,
  usesResponseCache: false,
  requiresRequestSignature: false,
  encode: ({ credential }) => encodeSystemGetSystemInfoRequest(credential),
  decode: decodeSystemGetSystemInfoResponse,
};

/** Provides unauthenticated region and maintenance information. */
export class SystemApi {
  constructor(
    private readonly client: ApiClient,
    private readonly session: ApiSession,
  ) {}

  /**
   * Fetches region system state, including maintenance, review routing, and
   * title Gacha assets. The request defaults to the session credential and does
   * not require an authenticated game session or master version.
   *
   * @rpc /rpc.api.System/GetSystemInfo
   */
  getSystemInfo(
    credential: string | undefined = this.session.credentialValue,
    options?: RequestOptions,
  ): Promise<SystemGetSystemInfoResponse> {
    if (!credential)
      throw new HolodoriApiError(
        "credential is required for System/GetSystemInfo",
        SYSTEM_GET_SYSTEM_INFO.path,
      );
    return this.client.call(SYSTEM_GET_SYSTEM_INFO, { credential }, options);
  }
}

export { SYSTEM_GET_SYSTEM_INFO };
export type {
  SystemGachaAssetInfo,
  SystemGetSystemInfoResponse,
  SystemMaintenanceInfo,
  SystemReviewInfo,
} from "../codecs/system.js";
