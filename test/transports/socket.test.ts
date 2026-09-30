import type { EventEmitter } from "node:events";

import assert from "node:assert/strict";
import { errorMonitor } from "node:events";
import { Duplex, PassThrough } from "node:stream";
import { connect as connectTls } from "node:tls";
import { test } from "vitest";

import { destroySocket, waitForSocket } from "../../src/transports/socket.js";

void test("consumes asynchronous errors from intentional socket destruction", async () => {
  const socket = createTlsSocket();
  const observed: Error[] = [];
  const monitoredSocket = socket as unknown as EventEmitter;
  monitoredSocket.on(errorMonitor, (error: Error) => observed.push(error));
  const existingErrorListeners = socket.listenerCount("error");
  const closed = new Promise<void>((resolve) => socket.once("close", resolve));

  destroySocket(socket);

  await closed;
  assert.equal(observed.length, 1);
  assert.equal(observed[0]?.name, "AbortError");
  assert.equal(socket.listenerCount("error"), existingErrorListeners);
});

void test("settles an aborted TLS socket wait without an unhandled error", async () => {
  const socket = createTlsSocket();
  const observed: Error[] = [];
  const monitoredSocket = socket as unknown as EventEmitter;
  monitoredSocket.on(errorMonitor, (error: Error) => observed.push(error));
  const controller = new AbortController();
  const waiting = waitForSocket(
    socket,
    "secureConnect",
    controller.signal,
    "tls",
    "target TLS failed",
  );
  const closed = new Promise<void>((resolve) => socket.once("close", resolve));

  controller.abort();
  await assert.rejects(waiting, (error: unknown) => {
    return (
      error instanceof Error && "phase" in error && error.phase === "aborted"
    );
  });
  await closed;

  assert.equal(observed.length, 1);
  assert.equal(observed[0]?.name, "AbortError");
});

function createTlsSocket() {
  const rawSocket = Duplex.from({
    readable: new PassThrough(),
    writable: new PassThrough(),
  });
  return connectTls({ socket: rawSocket });
}
