import type { ApiTransport } from "../transports/types.js";

import { assertGrpcSuccess, GrpcStatusError } from "../protocol/grpc.js";
import { decryptProto, encryptProto } from "../protocol/proto-enc.js";
import { ApiTransportError } from "../transports/error.js";
import { HolodoriApiError } from "./errors.js";
import { type ApiMethod, type RequestSigner } from "./method.js";
import { type RequestOptions } from "./request-options.js";
import { type ApiSession } from "./session.js";

const DEFAULT_TIMEOUT_MS = 30_000;
const DOTNET_EPOCH_TICKS = 621355968000000000n;

interface ApiClientCallOptions extends RequestOptions {
  readonly baseUrl?: string;
}

export interface ApiClientOptions {
  readonly appVersion: string;
  readonly apiSecret: string;
  readonly baseUrl: string;
  readonly bundleId: string;
  readonly lang: string;
  readonly os: string;
  readonly store: string;
  readonly additionalHeaders?: Readonly<Record<string, string>>;
  readonly requestIdFactory?: () => string;
  readonly requestSigner?: RequestSigner;
  readonly timeoutMs: number;
}

export class ApiClient {
  private baseUrl: string;
  private readonly lastRequestTicks = { value: 0n };

  constructor(
    private readonly options: ApiClientOptions,
    private readonly session: ApiSession,
    private readonly transport: ApiTransport,
    private readonly ownsTransport = false,
  ) {
    this.baseUrl = options.baseUrl;
  }

  get currentBaseUrl(): string {
    return this.baseUrl;
  }

  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }

  async call<Request, Response>(
    method: ApiMethod<Request, Response>,
    request: Request,
    callOptions: ApiClientCallOptions = {},
  ): Promise<Response> {
    if (
      callOptions.timeoutMs !== undefined &&
      (!Number.isFinite(callOptions.timeoutMs) || callOptions.timeoutMs <= 0)
    ) {
      throw new HolodoriApiError(
        "request timeout must be a positive finite number",
        { kind: "configuration", rpcPath: method.path },
      );
    }
    const headers: Record<string, string> = {
      ...this.options.additionalHeaders,
      "content-type": "application/grpc+proto-enc",
      te: "trailers",
      "grpc-accept-encoding": "identity,gzip",
      "x-app-version": this.options.appVersion,
      "x-app-bundle-id": this.options.bundleId,
      "x-app-lang-type": this.options.lang,
      "x-app-os-type": this.options.os,
      "x-app-store-type": this.options.store,
    };
    if (method.requiresGameAuth) {
      const token = this.session.gameAuthTokenValue;
      if (!token)
        throw new HolodoriApiError(
          "authenticated API call requires a game auth token",
          { kind: "authentication", rpcPath: method.path },
        );
      headers["x-app-auth-token"] = token;
    }
    if (method.requiresMasterVersion) {
      const masterVersion = this.session.masterVersionValue;
      if (!masterVersion)
        throw new HolodoriApiError(
          "authenticated API call requires a master version",
          { kind: "authentication", rpcPath: method.path },
        );
      headers["x-app-master-version"] = masterVersion;
    }
    if (method.usesResponseCache)
      headers["x-app-request-id"] = this.createRequestId();

    const encryptedBody = encryptProto(
      method.encode(request),
      this.options.apiSecret,
    );
    if (method.requiresRequestSignature) {
      const signer = this.options.requestSigner;
      if (!signer)
        throw new HolodoriApiError(
          "request signature is required but no request signer was configured",
          { kind: "configuration", rpcPath: method.path },
        );
      Object.assign(
        headers,
        signer.sign({ path: method.path, body: encryptedBody, headers }),
      );
    }

    const requestId = headers["x-app-request-id"];
    let result;
    try {
      result = await this.transport.request({
        method: "POST",
        url: `${callOptions.baseUrl ?? this.baseUrl}${method.path}`,
        headers,
        body: encryptedBody,
        timeoutMs: callOptions.timeoutMs ?? this.options.timeoutMs,
        ...(callOptions.signal === undefined
          ? {}
          : { signal: callOptions.signal }),
      });
    } catch (error) {
      if (error instanceof HolodoriApiError) throw error;
      const transportPhase =
        error instanceof ApiTransportError ? error.phase : undefined;
      throw new HolodoriApiError(
        `${method.path} transport failed: ${errorMessage(error)}`,
        {
          kind: "transport",
          rpcPath: method.path,
          ...(requestId === undefined ? {} : { requestId }),
          ...(transportPhase === undefined ? {} : { transportPhase }),
          cause: error,
        },
      );
    }
    if (result.status !== 200) {
      throw new HolodoriApiError(
        `${method.path} HTTP status ${result.status}`,
        {
          kind: "http",
          rpcPath: method.path,
          httpStatus: result.status,
          ...(requestId === undefined ? {} : { requestId }),
        },
      );
    }
    try {
      assertGrpcSuccess(
        { ...result.headers },
        { ...result.trailers },
        method.path,
      );
      return method.decode(decryptProto(result.body, this.options.apiSecret));
    } catch (error) {
      if (error instanceof GrpcStatusError) {
        throw new HolodoriApiError(error.message, {
          kind: "grpc",
          rpcPath: method.path,
          grpcStatus: error.status,
          ...(requestId === undefined ? {} : { requestId }),
          cause: error,
        });
      }
      throw new HolodoriApiError(
        `${method.path} protocol failure: ${errorMessage(error)}`,
        {
          kind: "protocol",
          rpcPath: method.path,
          ...(requestId === undefined ? {} : { requestId }),
          cause: error,
        },
      );
    }
  }

  close(): void {
    if (this.ownsTransport) this.transport.close?.();
  }

  private createRequestId(): string {
    const custom = this.options.requestIdFactory?.();
    if (custom !== undefined) {
      if (!custom)
        throw new HolodoriApiError(
          "request ID factory returned an empty value",
          "request",
        );
      return custom;
    }
    const nowMilliseconds = Date.now();
    const timezoneOffsetMilliseconds =
      new Date(nowMilliseconds).getTimezoneOffset() * 60_000;
    const now =
      BigInt(nowMilliseconds - timezoneOffsetMilliseconds) * 10_000n +
      DOTNET_EPOCH_TICKS;
    this.lastRequestTicks.value =
      now > this.lastRequestTicks.value
        ? now
        : this.lastRequestTicks.value + 1n;
    return this.lastRequestTicks.value.toString();
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export { DEFAULT_TIMEOUT_MS };
