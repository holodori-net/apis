import assert from "node:assert/strict";
import { once } from "node:events";
import { readFileSync } from "node:fs";
import {
  createServer as createTcpServer,
  type Server,
  type Socket,
} from "node:net";
import { createServer as createTlsServer } from "node:tls";
import { onTestFinished, test } from "vitest";

import { HttpConnectTunnelConnector } from "../src/http-connect-transport.js";
import { buildSshForwardArguments } from "../src/ssh-transport.js";
import {
  ApiTransportError,
  type ApiTunnelConnector,
  Http2Transport,
} from "../src/transport.js";

const CERTIFICATE = readFileSync(
  new URL("./fixtures/proxy-cert.pem", import.meta.url),
);
const PRIVATE_KEY = readFileSync(
  new URL("./fixtures/proxy-key.pem", import.meta.url),
);

void test("builds a non-interactive OpenSSH stdio-forward command", () => {
  const args = buildSshForwardArguments(
    {
      target: "tpe",
      configFile: "/tmp/ssh-config",
      options: ["ConnectTimeout=10"],
    },
    "api.example:443",
  );
  assert.deepEqual(args, [
    "-F",
    "/tmp/ssh-config",
    "-T",
    "-o",
    "BatchMode=yes",
    "-o",
    "NumberOfPasswordPrompts=0",
    "-o",
    "StrictHostKeyChecking=yes",
    "-o",
    "ConnectTimeout=10",
    "-W",
    "api.example:443",
    "tpe",
  ]);
});

void test("rejects unsafe or interactive SSH options", () => {
  assert.throws(
    () =>
      buildSshForwardArguments(
        { target: "-oProxyCommand=bad" },
        "api.example:443",
      ),
    /invalid SSH target/,
  );
  assert.throws(
    () =>
      buildSshForwardArguments(
        { target: "tpe", options: ["BatchMode=no"] },
        "api.example:443",
      ),
    /controlled by the SDK/,
  );
  assert.throws(
    () =>
      buildSshForwardArguments(
        { target: "tpe", options: ["bad\nvalue"] },
        "api.example:443",
      ),
    /invalid SSH option/,
  );
});

void test("establishes an HTTP CONNECT tunnel with Basic auth and custom headers", async () => {
  let connectRequest = "";
  const proxy = await startEchoProxy(onTestFinished, false, (request) => {
    connectRequest = request;
  });
  const connector = new HttpConnectTunnelConnector({
    proxyUrl: `http://user:p%40ss@127.0.0.1:${proxy.port}`,
    headers: { "x-proxy-test": "yes" },
  });
  const tunnel = await connector.connect(new URL("https://api.example:443"), {
    signal: new AbortController().signal,
  });
  onTestFinished(() => {
    tunnel.destroy();
  });
  const received = once(tunnel, "data");
  tunnel.resume();
  tunnel.write("ping");
  const [receivedChunk] = (await received) as [Buffer];
  assert.equal(receivedChunk.toString(), "ping");
  assert.match(connectRequest, /^CONNECT api\.example:443 HTTP\/1\.1\r\n/m);
  assert.match(connectRequest, /proxy-authorization: Basic dXNlcjpwQHNz\r\n/i);
  assert.match(connectRequest, /x-proxy-test: yes\r\n/i);
});

void test("establishes CONNECT through an HTTPS proxy with a caller-owned CA", async () => {
  const proxy = await startEchoProxy(onTestFinished, true);
  const connector = new HttpConnectTunnelConnector({
    proxyUrl: `https://127.0.0.1:${proxy.port}`,
    proxyCa: CERTIFICATE,
  });
  const tunnel = await connector.connect(new URL("https://api.example:443"), {
    signal: new AbortController().signal,
  });
  onTestFinished(() => {
    tunnel.destroy();
  });
  const received = once(tunnel, "data");
  tunnel.resume();
  tunnel.write("secure-ping");
  const [receivedChunk] = (await received) as [Buffer];
  assert.equal(receivedChunk.toString(), "secure-ping");
});

void test("rejects CONNECT failures and does not expose proxy credentials", async () => {
  const proxy = await startFixedProxy(
    onTestFinished,
    "HTTP/1.1 407 Proxy Authentication Required\r\n\r\n",
  );
  const connector = new HttpConnectTunnelConnector({
    proxyUrl: `http://sensitive-user:sensitive-password@127.0.0.1:${proxy.port}`,
  });
  await assert.rejects(
    connector.connect(new URL("https://api.example:443"), {
      signal: new AbortController().signal,
    }),
    (error: unknown) => {
      assert(error instanceof ApiTransportError);
      assert.equal(error.phase, "proxy");
      assert.match(error.message, /status 407/);
      assert.doesNotMatch(error.message, /sensitive/);
      return true;
    },
  );
});

void test("bounds CONNECT response headers", async () => {
  const proxy = await startFixedProxy(
    onTestFinished,
    `HTTP/1.1 200 OK\r\nx-fill: ${"a".repeat(33_000)}`,
  );
  const connector = new HttpConnectTunnelConnector({
    proxyUrl: `http://127.0.0.1:${proxy.port}`,
  });
  await assert.rejects(
    connector.connect(new URL("https://api.example:443"), {
      signal: new AbortController().signal,
    }),
    /headers are too large/,
  );
});

void test("preserves bytes received after CONNECT response headers", async () => {
  const proxy = await startFixedProxy(
    onTestFinished,
    "HTTP/1.1 200 Connection Established\r\n\r\nprefetched",
  );
  const connector = new HttpConnectTunnelConnector({
    proxyUrl: `http://127.0.0.1:${proxy.port}`,
  });
  const tunnel = await connector.connect(new URL("https://api.example:443"), {
    signal: new AbortController().signal,
  });
  onTestFinished(() => {
    tunnel.destroy();
  });
  const received = once(tunnel, "data");
  tunnel.resume();
  const [receivedChunk] = (await received) as [Buffer];
  assert.equal(receivedChunk.toString(), "prefetched");
});

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

void test("rejects ambiguous proxy authorization configuration", () => {
  assert.throws(
    () =>
      new HttpConnectTunnelConnector({
        proxyUrl: "http://user:password@proxy.example",
        headers: { "Proxy-Authorization": "Bearer token" },
      }),
    /both the URL and headers/,
  );
});

async function startEchoProxy(
  cleanup: Cleanup,
  secure: boolean,
  onRequest?: (request: string) => void,
): Promise<{ port: number }> {
  const sockets = new Set<Socket>();
  const handle = (socket: Socket) => {
    sockets.add(socket);
    socket.once("close", () => sockets.delete(socket));
    let request = Buffer.alloc(0);
    let connected = false;
    socket.on("data", (chunk: Buffer) => {
      if (connected) {
        socket.write(chunk);
        return;
      }
      request = Buffer.concat([request, chunk]);
      const boundary = request.indexOf("\r\n\r\n");
      if (boundary < 0) return;
      connected = true;
      onRequest?.(request.subarray(0, boundary + 4).toString("latin1"));
      socket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
      const remaining = request.subarray(boundary + 4);
      if (remaining.length > 0) socket.write(remaining);
    });
  };
  const server = secure
    ? createTlsServer({ cert: CERTIFICATE, key: PRIVATE_KEY }, handle)
    : createTcpServer(handle);
  return await listen(cleanup, server, sockets);
}

async function startFixedProxy(
  cleanup: Cleanup,
  response: string,
): Promise<{ port: number }> {
  const sockets = new Set<Socket>();
  const server = createTcpServer((socket) => {
    sockets.add(socket);
    socket.once("close", () => sockets.delete(socket));
    socket.once("data", () => socket.write(response));
  });
  return await listen(cleanup, server, sockets);
}

async function listen(
  cleanup: Cleanup,
  server: Server,
  sockets: Set<Socket>,
): Promise<{ port: number }> {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert(address && typeof address === "object");
  cleanup(async () => {
    for (const socket of sockets) socket.destroy();
    const closed = once(server, "close");
    server.close();
    await closed;
  });
  return { port: address.port };
}

type Cleanup = (callback: () => Promise<void> | void) => void;
