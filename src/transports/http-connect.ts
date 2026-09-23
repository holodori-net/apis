import type { Duplex } from "node:stream";

import { connect as connectTcp, isIP } from "node:net";
import { connect as connectTls, type SecureContextOptions } from "node:tls";

import type { ApiTunnelConnector, ApiTunnelContext } from "./types.js";

import { ApiTransportError } from "./error.js";
import { Http2Transport } from "./http2.js";
import { targetAuthority, waitForSocket } from "./socket.js";

const MAX_CONNECT_RESPONSE_BYTES = 32 * 1024;
const CONTROLLED_PROXY_HEADERS = new Set([
  "connection",
  "content-length",
  "host",
  "transfer-encoding",
]);

export interface HttpConnectHttp2TransportOptions {
  readonly proxyUrl: string | URL;
  readonly headers?: Readonly<Record<string, string>>;
  readonly proxyCa?: SecureContextOptions["ca"];
}

export class HttpConnectHttp2Transport extends Http2Transport {
  constructor(options: HttpConnectHttp2TransportOptions) {
    super({ connector: new HttpConnectTunnelConnector(options) });
  }
}

export class HttpConnectTunnelConnector implements ApiTunnelConnector {
  private readonly proxy: URL;
  private readonly headers: Readonly<Record<string, string>>;
  private readonly proxyCa: SecureContextOptions["ca"] | undefined;

  constructor(options: HttpConnectHttp2TransportOptions) {
    this.proxy = parseProxyUrl(options.proxyUrl);
    this.headers = normalizeProxyHeaders(
      options.headers ?? {},
      Boolean(this.proxy.username || this.proxy.password),
    );
    this.proxyCa = options.proxyCa;
  }

  async connect(target: URL, context: ApiTunnelContext): Promise<Duplex> {
    const socket = await connectToProxy(
      this.proxy,
      this.proxyCa,
      context.signal,
    );
    try {
      const authority = targetAuthority(target);
      const headers: Record<string, string> = {
        host: authority,
        ...this.headers,
      };
      if (this.proxy.username || this.proxy.password) {
        headers["proxy-authorization"] = basicProxyAuthorization(this.proxy);
      }
      const lines = [`CONNECT ${authority} HTTP/1.1`];
      for (const [name, value] of Object.entries(headers))
        lines.push(`${name}: ${value}`);
      socket.write(`${lines.join("\r\n")}\r\n\r\n`);
      await readConnectResponse(socket, context.signal);
      return socket;
    } catch (error) {
      socket.destroy();
      throw error;
    }
  }
}

function parseProxyUrl(value: string | URL): URL {
  let url: URL;
  try {
    url = new URL(value.toString());
  } catch (error) {
    throw new ApiTransportError(
      "invalid HTTP CONNECT proxy URL",
      "validation",
      error,
    );
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ApiTransportError(
      "HTTP CONNECT proxy URL must use http: or https:",
      "validation",
    );
  }
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new ApiTransportError(
      "HTTP CONNECT proxy URL must be an origin without a path",
      "validation",
    );
  }
  try {
    if (url.username) decodeURIComponent(url.username);
    if (url.password) decodeURIComponent(url.password);
  } catch (error) {
    throw new ApiTransportError(
      "HTTP CONNECT proxy credentials are malformed",
      "validation",
      error,
    );
  }
  return url;
}

function normalizeProxyHeaders(
  headers: Readonly<Record<string, string>>,
  hasUrlCredentials: boolean,
): Readonly<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const [rawName, value] of Object.entries(headers)) {
    const name = rawName.toLowerCase();
    if (!/^[!#$%&'*+.^_`|~0-9a-z-]+$/.test(name)) {
      throw new ApiTransportError(
        `invalid HTTP CONNECT proxy header name: ${rawName}`,
        "validation",
      );
    }
    if (typeof value !== "string" || /[\r\n]/.test(value)) {
      throw new ApiTransportError(
        `invalid HTTP CONNECT proxy header value for ${name}`,
        "validation",
      );
    }
    if (CONTROLLED_PROXY_HEADERS.has(name)) {
      throw new ApiTransportError(
        `HTTP CONNECT proxy header ${name} is controlled by the SDK`,
        "validation",
      );
    }
    if (name === "proxy-authorization" && hasUrlCredentials) {
      throw new ApiTransportError(
        "proxy authorization cannot be supplied in both the URL and headers",
        "validation",
      );
    }
    result[name] = value;
  }
  return result;
}

async function connectToProxy(
  proxy: URL,
  ca: SecureContextOptions["ca"] | undefined,
  signal: AbortSignal,
): Promise<Duplex> {
  const port = proxy.port
    ? Number(proxy.port)
    : proxy.protocol === "https:"
      ? 443
      : 80;
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new ApiTransportError(
      "HTTP CONNECT proxy URL contains an invalid port",
      "validation",
    );
  }
  if (proxy.protocol === "http:") {
    const socket = connectTcp({ host: proxy.hostname, port });
    await waitForSocket(
      socket,
      "connect",
      signal,
      "proxy",
      "proxy connection failed",
    );
    return socket;
  }
  const socket = connectTls({
    host: proxy.hostname,
    port,
    ...(isIP(proxy.hostname) === 0 ? { servername: proxy.hostname } : {}),
    ...(ca === undefined ? {} : { ca }),
    ALPNProtocols: ["http/1.1"],
  });
  await waitForSocket(
    socket,
    "secureConnect",
    signal,
    "proxy",
    "HTTPS proxy TLS failed",
  );
  return socket;
}

function basicProxyAuthorization(proxy: URL): string {
  const username = decodeURIComponent(proxy.username);
  const password = decodeURIComponent(proxy.password);
  return `Basic ${Buffer.from(`${username}:${password}`, "utf8").toString("base64")}`;
}

function readConnectResponse(
  socket: Duplex,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let buffered = Buffer.alloc(0);
    const cleanup = () => {
      socket.removeListener("data", onData);
      socket.removeListener("error", onError);
      socket.removeListener("close", onClose);
      signal.removeEventListener("abort", onAbort);
    };
    const finish = (error?: Error) => {
      cleanup();
      if (error) reject(error);
      else resolve();
    };
    const onData = (chunk: Buffer) => {
      buffered = Buffer.concat([buffered, chunk]);
      const boundary = buffered.indexOf("\r\n\r\n");
      if (boundary < 0) {
        if (buffered.length > MAX_CONNECT_RESPONSE_BYTES) {
          finish(
            new ApiTransportError(
              "HTTP CONNECT proxy response headers are too large",
              "proxy",
            ),
          );
        }
        return;
      }
      if (boundary + 4 > MAX_CONNECT_RESPONSE_BYTES) {
        finish(
          new ApiTransportError(
            "HTTP CONNECT proxy response headers are too large",
            "proxy",
          ),
        );
        return;
      }
      const firstLine =
        buffered.subarray(0, boundary).toString("latin1").split("\r\n", 1)[0] ??
        "";
      const match = /^HTTP\/1\.[01] ([0-9]{3})(?: |$)/.exec(firstLine);
      if (!match) {
        finish(
          new ApiTransportError(
            "HTTP CONNECT proxy returned a malformed response",
            "proxy",
          ),
        );
        return;
      }
      const status = Number(match[1]);
      if (status < 200 || status >= 300) {
        finish(
          new ApiTransportError(
            `HTTP CONNECT proxy returned status ${status}`,
            "proxy",
          ),
        );
        return;
      }
      const remaining = buffered.subarray(boundary + 4);
      socket.pause();
      if (remaining.length > 0) socket.unshift(remaining);
      finish();
    };
    const onError = (error: Error) =>
      finish(
        new ApiTransportError(
          `HTTP CONNECT proxy failed: ${error.message}`,
          "proxy",
          error,
        ),
      );
    const onClose = () =>
      finish(
        new ApiTransportError(
          "HTTP CONNECT proxy closed before establishing a tunnel",
          "proxy",
        ),
      );
    const onAbort = () => {
      socket.destroy();
      finish(
        new ApiTransportError("HTTP CONNECT proxy request aborted", "aborted"),
      );
    };
    socket.on("data", onData);
    socket.once("error", onError);
    socket.once("close", onClose);
    if (signal.aborted) onAbort();
    else signal.addEventListener("abort", onAbort, { once: true });
    socket.resume();
  });
}
