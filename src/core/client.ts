import { assertGrpcSuccess, decryptProto, encryptProto } from "../proto-enc.js";
import { type ApiTransport, Http2Transport } from "../transport.js";
import { type ApiMethod, type RequestSigner } from "./method.js";
import { type ApiSession } from "./session.js";

const DEFAULT_TIMEOUT_MS = 30_000;
const DOTNET_EPOCH_TICKS = 621355968000000000n;

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

export class HolodoriApiError extends Error {
  readonly status: number | undefined;
  readonly path: string;

  constructor(message: string, path: string, status?: number) {
    super(message);
    this.name = "HolodoriApiError";
    this.path = path;
    this.status = status;
  }
}

export class ApiClient {
  private baseUrl: string;
  private readonly lastRequestTicks = { value: 0n };

  constructor(
    private readonly options: ApiClientOptions,
    private readonly session: ApiSession,
    private readonly transport: ApiTransport = new Http2Transport(),
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
    baseUrl = this.baseUrl,
  ): Promise<Response> {
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
          method.path,
        );
      headers["x-app-auth-token"] = token;
    }
    if (method.requiresMasterVersion) {
      const masterVersion = this.session.masterVersionValue;
      if (!masterVersion)
        throw new HolodoriApiError(
          "authenticated API call requires a master version",
          method.path,
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
          method.path,
        );
      Object.assign(
        headers,
        signer.sign({ path: method.path, body: encryptedBody, headers }),
      );
    }

    const result = await this.transport.request({
      method: "POST",
      url: `${baseUrl}${method.path}`,
      headers,
      body: encryptedBody,
      timeoutMs: this.options.timeoutMs,
    });
    if (result.status !== 200) {
      throw new HolodoriApiError(
        `${method.path} HTTP status ${result.status}`,
        method.path,
        result.status,
      );
    }
    assertGrpcSuccess(
      { ...result.headers },
      { ...result.trailers },
      method.path,
    );
    return method.decode(decryptProto(result.body, this.options.apiSecret));
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
    const now = BigInt(Date.now()) * 10_000n + DOTNET_EPOCH_TICKS;
    this.lastRequestTicks.value =
      now > this.lastRequestTicks.value
        ? now
        : this.lastRequestTicks.value + 1n;
    return this.lastRequestTicks.value.toString();
  }
}

export { DEFAULT_TIMEOUT_MS };
