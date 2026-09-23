import type { Duplex } from "node:stream";

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

export interface ApiTunnelContext {
  readonly signal: AbortSignal;
}

/** Opens a raw byte tunnel to the target URL host and port. */
export interface ApiTunnelConnector {
  connect(target: URL, context: ApiTunnelContext): Promise<Duplex>;
  close?(): void;
}
