import assert from "node:assert/strict";
import { test } from "vitest";

import {
  decodeHealthCheckResponse,
  encodeHealthCheckRequest,
  HealthCheckServingStatus,
} from "../src/codecs/health.js";
import { encodeStringField, encodeVarintField } from "../src/low-level.js";
import { HEALTH_CHECK, HealthApi } from "../src/services/health.js";

void test("encodes health check service and decodes serving status", () => {
  assert.deepEqual(encodeHealthCheckRequest(), Buffer.alloc(0));
  assert.deepEqual(
    encodeHealthCheckRequest("rpc.api.Home"),
    encodeStringField(1, "rpc.api.Home"),
  );
  assert.deepEqual(decodeHealthCheckResponse(encodeVarintField(1, 1)), {
    status: HealthCheckServingStatus.Serving,
  });
});

void test("HealthApi checks service without auth, master version, cache, or signature", async () => {
  const api = new HealthApi({
    call: (
      method: { path: string; encode: (request: unknown) => Buffer },
      request: unknown,
    ) => {
      assert.equal(method.path, "/rpc.api.Health/Check");
      assert.deepEqual(
        method.encode(request),
        encodeStringField(1, "rpc.api.Shop"),
      );
      return Promise.resolve({ status: HealthCheckServingStatus.Serving });
    },
  } as never);

  assert.deepEqual(await api.check("rpc.api.Shop"), {
    status: HealthCheckServingStatus.Serving,
  });
  assert.equal(HEALTH_CHECK.requiresGameAuth, false);
  assert.equal(HEALTH_CHECK.requiresMasterVersion, false);
  assert.equal(HEALTH_CHECK.usesResponseCache, false);
  assert.equal(HEALTH_CHECK.requiresRequestSignature, false);
});
