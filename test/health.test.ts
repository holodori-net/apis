import assert from "node:assert/strict";
import { test } from "vitest";

import { encodeStringField, encodeVarintField } from "../src/low-level.js";
import { HEALTH_CHECK, HealthApi } from "../src/services/health.js";

void test("encodes health check service and decodes serving status", () => {
  assert.deepEqual(HEALTH_CHECK.encode(""), Buffer.alloc(0));
  assert.deepEqual(
    HEALTH_CHECK.encode("rpc.api.Home"),
    encodeStringField(1, "rpc.api.Home"),
  );
  assert.deepEqual(HEALTH_CHECK.decode(encodeVarintField(1, 1)), {
    $typeName: "rpc.api.HealthCheckResponse",
    status: 1,
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
      return Promise.resolve({ status: 1 });
    },
  } as never);

  assert.deepEqual(await api.check("rpc.api.Shop"), {
    status: 1,
  });
  assert.equal(HEALTH_CHECK.requiresGameAuth, false);
  assert.equal(HEALTH_CHECK.requiresMasterVersion, false);
  assert.equal(HEALTH_CHECK.usesResponseCache, false);
  assert.equal(HEALTH_CHECK.requiresRequestSignature, false);
});
