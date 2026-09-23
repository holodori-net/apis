import assert from "node:assert/strict";
import { test } from "vitest";

import type { ApiTunnelConnector } from "../../src/transports/types.js";

import { ApiTransportError } from "../../src/transports/error.js";
import { Http2Transport } from "../../src/transports/http2.js";

void test("applies timeout, abort, and close to connector setup", async () => {
  const connector: ApiTunnelConnector = {
    connect(_target, context) {
      return new Promise((_resolve, reject) => {
        context.signal.addEventListener(
          "abort",
          () => reject(new ApiTransportError("connector aborted", "aborted")),
          { once: true },
        );
      });
    },
  };
  const timed = new Http2Transport({ connector });
  await assert.rejects(
    timed.request({
      method: "POST",
      url: "https://api.example/test",
      timeoutMs: 10,
    }),
    (error: unknown) =>
      error instanceof ApiTransportError && error.phase === "timeout",
  );

  const closed = new Http2Transport({ connector });
  const request = closed.request({
    method: "POST",
    url: "https://api.example/test",
  });
  closed.close();
  await assert.rejects(
    request,
    (error: unknown) =>
      error instanceof ApiTransportError && error.phase === "closed",
  );
  await assert.rejects(
    closed.request({ method: "POST", url: "https://api.example/test" }),
    (error: unknown) =>
      error instanceof ApiTransportError && error.phase === "closed",
  );
  closed.close();
});
