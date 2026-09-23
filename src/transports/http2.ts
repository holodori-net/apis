import type { Duplex } from "node:stream";
import type { TLSSocket } from "node:tls";

import {
  type ClientHttp2Session,
  connect as connectHttp2,
  type IncomingHttpHeaders,
} from "node:http2";

import type {
  ApiTransport,
  ApiTransportRequest,
  ApiTransportResponse,
  ApiTunnelConnector,
} from "./types.js";

import { ApiTransportError, errorMessage } from "./error.js";
import { connectDirect, connectTargetTls } from "./socket.js";

export interface Http2TransportOptions {
  readonly connector?: ApiTunnelConnector;
}

interface ActiveRequest {
  abort(): void;
}

export class Http2Transport implements ApiTransport {
  private readonly connector: ApiTunnelConnector | undefined;
  private readonly active = new Set<ActiveRequest>();
  private closed = false;

  constructor(options: Http2TransportOptions = {}) {
    this.connector = options.connector;
  }

  async request(request: ApiTransportRequest): Promise<ApiTransportResponse> {
    if (this.closed)
      throw new ApiTransportError("transport is closed", "closed");
    const url = parseApiUrl(request.url);
    const timeoutMs = request.timeoutMs ?? 30_000;
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      throw new ApiTransportError(
        "request timeout must be a positive finite number",
        "validation",
      );
    }

    const controller = new AbortController();
    let abortReason: "closed" | "external" | "timeout" | undefined;
    const active: ActiveRequest = {
      abort: () => {
        abortReason = "closed";
        controller.abort();
      },
    };
    this.active.add(active);
    const onExternalAbort = () => {
      abortReason = "external";
      controller.abort();
    };
    if (request.signal?.aborted) onExternalAbort();
    else
      request.signal?.addEventListener("abort", onExternalAbort, {
        once: true,
      });
    const timer = setTimeout(() => {
      abortReason = "timeout";
      controller.abort();
    }, timeoutMs);

    let rawSocket: Duplex | undefined;
    let tlsSocket: TLSSocket | undefined;
    let session: ClientHttp2Session | undefined;
    try {
      throwIfAborted(controller.signal, abortReason, timeoutMs);
      rawSocket = this.connector
        ? await this.connector.connect(url, { signal: controller.signal })
        : await connectDirect(url, controller.signal);
      throwIfAborted(controller.signal, abortReason, timeoutMs);
      tlsSocket = await connectTargetTls(rawSocket, url, controller.signal);
      rawSocket = undefined;
      session = connectHttp2(url.origin, {
        createConnection: () => tlsSocket!,
      });
      return await requestHttp2(session, url, request, controller.signal);
    } catch (error) {
      if (controller.signal.aborted)
        throw abortError(abortReason, timeoutMs, error);
      if (error instanceof ApiTransportError) throw error;
      throw new ApiTransportError(
        `HTTP/2 request failed: ${errorMessage(error)}`,
        "http2",
        error,
      );
    } finally {
      clearTimeout(timer);
      request.signal?.removeEventListener("abort", onExternalAbort);
      this.active.delete(active);
      session?.destroy();
      tlsSocket?.destroy();
      rawSocket?.destroy();
    }
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    for (const request of this.active) request.abort();
    this.active.clear();
    this.connector?.close?.();
  }
}

function parseApiUrl(text: string): URL {
  let url: URL;
  try {
    url = new URL(text);
  } catch (error) {
    throw new ApiTransportError(
      `invalid request URL: ${text}`,
      "validation",
      error,
    );
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new ApiTransportError(
      "API URL must use HTTPS without credentials",
      "validation",
    );
  }
  return url;
}

function requestHttp2(
  session: ClientHttp2Session,
  url: URL,
  request: ApiTransportRequest,
  signal: AbortSignal,
): Promise<ApiTransportResponse> {
  return new Promise((resolve, reject) => {
    const body = request.body ?? Buffer.alloc(0);
    let headers: Record<string, string> = {};
    let trailers: Record<string, string> = {};
    const chunks: Buffer[] = [];
    const emptyGet = request.method === "GET" && body.length === 0;
    const stream = session.request(
      {
        ":method": request.method,
        ":path": `${url.pathname}${url.search}`,
        ":scheme": "https",
        ":authority": url.host,
        ...request.headers,
      },
      { endStream: emptyGet },
    );
    let settled = false;
    const cleanup = () => {
      signal.removeEventListener("abort", onAbort);
      session.removeListener("error", onSessionError);
    };
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else {
        resolve({
          status: Number(headers[":status"] ?? 0),
          headers,
          trailers,
          body: Buffer.concat(chunks),
        });
      }
    };
    const onAbort = () => {
      stream.destroy();
      finish(new ApiTransportError("HTTP/2 request aborted", "aborted"));
    };
    const onSessionError = (error: Error) =>
      finish(
        new ApiTransportError(
          `HTTP/2 session failed: ${error.message}`,
          "http2",
          error,
        ),
      );
    session.once("error", onSessionError);
    stream.once("response", (incoming: IncomingHttpHeaders) => {
      headers = headersToRecord(incoming);
    });
    stream.on("trailers", (incoming: IncomingHttpHeaders) => {
      trailers = headersToRecord(incoming);
    });
    stream.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    stream.once("error", (error: Error) =>
      finish(
        new ApiTransportError(
          `HTTP/2 stream failed: ${error.message}`,
          "http2",
          error,
        ),
      ),
    );
    stream.once("end", () => finish());
    if (signal.aborted) onAbort();
    else signal.addEventListener("abort", onAbort, { once: true });
    if (!emptyGet) stream.end(body);
  });
}

function headersToRecord(headers: IncomingHttpHeaders): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    result[key.toLowerCase()] = Array.isArray(value)
      ? value.join(", ")
      : String(value);
  }
  return result;
}

function throwIfAborted(
  signal: AbortSignal,
  reason: "closed" | "external" | "timeout" | undefined,
  timeoutMs: number,
): void {
  if (signal.aborted) throw abortError(reason, timeoutMs);
}

function abortError(
  reason: "closed" | "external" | "timeout" | undefined,
  timeoutMs: number,
  cause?: unknown,
): ApiTransportError {
  if (reason === "timeout") {
    return new ApiTransportError(
      `HTTP/2 request timed out after ${timeoutMs} ms`,
      "timeout",
      cause,
    );
  }
  if (reason === "closed") {
    return new ApiTransportError(
      "transport closed during request",
      "closed",
      cause,
    );
  }
  return new ApiTransportError("HTTP/2 request aborted", "aborted", cause);
}
