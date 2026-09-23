import {
  decodeHealthCheckResponse,
  encodeHealthCheckRequest,
  type HealthCheckResponse,
} from "../codecs/health.js";
import { type ApiClient } from "../core/client.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";

const HEALTH_CHECK: ApiMethod<string, HealthCheckResponse> = {
  path: "/rpc.api.Health/Check",
  requiresGameAuth: false,
  requiresMasterVersion: false,
  usesResponseCache: false,
  requiresRequestSignature: false,
  encode: encodeHealthCheckRequest,
  decode: decodeHealthCheckResponse,
};

/** Provides unauthenticated server health checks. */
export class HealthApi {
  constructor(private readonly client: ApiClient) {}

  /** Checks whether the named game service is serving; empty checks overall health.
   *
   * @rpc /rpc.api.Health/Check
   */
  check(service = "", options?: RequestOptions): Promise<HealthCheckResponse> {
    return this.client.call(HEALTH_CHECK, service, options);
  }
}

export { HEALTH_CHECK };
export { HealthCheckServingStatus } from "../codecs/health.js";
export type { HealthCheckResponse } from "../codecs/health.js";
