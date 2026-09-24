import type { HealthCheckResponse } from "../protos/gen/rpc/api/health.gen_pb.js";

import { type ApiClient } from "../core/client.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import { decodeProtobuf, encodeProtobuf } from "../protos/codec.js";
import {
  HealthCheckRequestSchema,
  HealthCheckResponseSchema,
} from "../protos/gen/rpc/api/health.gen_pb.js";

const HEALTH_CHECK: ApiMethod<string, HealthCheckResponse> = {
  path: "/rpc.api.Health/Check",
  requiresGameAuth: false,
  requiresMasterVersion: false,
  usesResponseCache: false,
  requiresRequestSignature: false,
  encode: (service) => encodeProtobuf(HealthCheckRequestSchema, { service }),
  decode: (data) => decodeProtobuf(HealthCheckResponseSchema, data),
};

/** Provides unauthenticated server health checks. */
export class HealthApi {
  constructor(private readonly client: ApiClient) {}

  /** Checks whether the named game service is serving; empty checks overall health.
   *
   * @rpc /rpc.api.Health/Check
   */
  check(
    service: string = "",
    options?: RequestOptions,
  ): Promise<HealthCheckResponse> {
    return this.client.call(HEALTH_CHECK, service, options);
  }
}

export { HEALTH_CHECK };
export { HealthCheckServingStatus } from "../protos/gen/enums/health_check_serving_status.gen_pb.js";
export type { HealthCheckResponse } from "../protos/gen/rpc/api/health.gen_pb.js";
