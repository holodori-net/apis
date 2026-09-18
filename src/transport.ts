import {
  type ClientHttp2Session,
  connect,
  type IncomingHttpHeaders,
} from "node:http2";

export interface ApiTransportRequest {
  readonly method: "GET" | "POST";
  readonly url: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: Buffer;
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
}

export interface ApiTransportResponse {
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
  readonly trailers: Readonly<Record<string, string>>;
  readonly body: Buffer;
}

export interface ApiTransport {
  request(request: ApiTransportRequest): Promise<ApiTransportResponse>;
  close?(): void;
}

export class Http2Transport implements ApiTransport {
  private readonly sessions = new Map<string, ClientHttp2Session>();

  async request(request: ApiTransportRequest): Promise<ApiTransportResponse> {
    const url = parseUrl(request.url);
    const session = this.getSession(url.origin);
    const body = request.body ?? Buffer.alloc(0);
    const headers = {
      ":method": request.method,
      ":path": `${url.pathname}${url.search}`,
      ":scheme": "https",
      ":authority": url.host,
      ...request.headers,
    };

    return await new Promise<ApiTransportResponse>((resolve, reject) => {
      let settled = false;
      const timeoutMs = request.timeoutMs ?? 30_000;
      const timer = setTimeout(() => {
        finish(new Error(`HTTP/2 request timed out after ${timeoutMs} ms`));
      }, timeoutMs);
      const finish = (
        error: Error | undefined,
        value?: ApiTransportResponse,
      ) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        request.signal?.removeEventListener("abort", onAbort);
        if (error) {
          session.destroy();
          reject(error);
        } else if (value) {
          resolve(value);
        } else {
          reject(new Error("HTTP/2 request completed without a response"));
        }
      };
      const onAbort = () => finish(new Error("HTTP/2 request aborted"));
      if (request.signal?.aborted) {
        onAbort();
        return;
      }
      request.signal?.addEventListener("abort", onAbort, { once: true });

      let responseHeaders: Record<string, string> = {};
      let responseTrailers: Record<string, string> = {};
      const chunks: Buffer[] = [];
      const stream = session.request(headers, {
        endStream: request.method === "GET" && body.length === 0,
      });
      stream.once("response", (incoming: IncomingHttpHeaders) => {
        responseHeaders = headersToRecord(incoming);
      });
      stream.on("trailers", (incoming: IncomingHttpHeaders) => {
        responseTrailers = headersToRecord(incoming);
      });
      stream.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
      stream.once("error", (error: Error) => finish(error));
      stream.once("end", () => {
        finish(undefined, {
          status: Number(responseHeaders[":status"] ?? 0),
          headers: responseHeaders,
          trailers: responseTrailers,
          body: Buffer.concat(chunks),
        });
        session.close();
      });
      if (!(request.method === "GET" && body.length === 0)) stream.end(body);
    });
  }

  close(): void {
    for (const session of this.sessions.values()) session.destroy();
    this.sessions.clear();
  }

  private getSession(origin: string): ClientHttp2Session {
    const existing = this.sessions.get(origin);
    if (existing && !existing.closed && !existing.destroyed) return existing;
    const session = connect(origin);
    this.sessions.set(origin, session);
    const forget = () => {
      if (this.sessions.get(origin) === session) this.sessions.delete(origin);
    };
    session.once("close", forget);
    session.once("goaway", forget);
    session.once("error", forget);
    return session;
  }
}

function parseUrl(text: string): URL {
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw new Error(`invalid request URL: ${text}`);
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("API URL must use HTTPS without credentials");
  }
  return url;
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
