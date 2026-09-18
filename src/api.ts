import {
  decodeCredentialResponse,
  decodeGameAuthTokenResponse,
  decodeMasterVersionResponse,
  decodeNoticeGetResponse,
  decodeNoticeListInCategoryResponse,
  decodeNoticeTopResponse,
  decodeUpdateResponse,
  encodeCredentialRequest,
  encodeEmpty,
  encodeListInCategoryRequest,
  encodeNoticeGetRequest,
  encodeStringListRequest,
  type NoticeGetResponse,
  type NoticeListInCategoryResponse,
  type NoticeTopResponse,
  type NoticeUpdateResponse,
} from "./codecs.js";
import { assertGrpcSuccess, decryptProto, encryptProto } from "./proto-enc.js";
import { type ApiTransport, Http2Transport } from "./transport.js";

const DEFAULT_BASE_URL = "https://jp.game-hololive-dreams.com";
const DEFAULT_TIMEOUT_MS = 30_000;
const DOTNET_EPOCH_TICKS = 621355968000000000n;

export interface HolodoriApiOptions {
  readonly appVersion: string;
  readonly apiSecret: string;
  readonly baseUrl?: string;
  readonly bundleId?: string;
  readonly lang?: string;
  readonly os?: string;
  readonly store?: string;
  readonly additionalHeaders?: Readonly<Record<string, string>>;
  readonly credential?: string;
  readonly gameAuthToken?: string;
  readonly masterVersion?: string;
  readonly requestIdFactory?: () => string;
  readonly timeoutMs?: number;
  readonly autoAuthenticate?: boolean;
}

export interface AuthenticatedSession {
  readonly credential: string | undefined;
  readonly gameAuthToken: string;
  readonly masterVersion: string;
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

export class HolodoriApi {
  readonly notice: NoticeApi;

  private readonly options: Required<
    Pick<
      HolodoriApiOptions,
      | "apiSecret"
      | "appVersion"
      | "baseUrl"
      | "bundleId"
      | "lang"
      | "os"
      | "store"
      | "timeoutMs"
    >
  > &
    HolodoriApiOptions;
  private readonly transport: ApiTransport;
  private readonly ownsTransport: boolean;
  private credential: string | undefined;
  private gameAuthToken: string | undefined;
  private masterVersion: string | undefined;
  private authentication: Promise<AuthenticatedSession> | undefined;
  private lastRequestTicks = 0n;

  constructor(options: HolodoriApiOptions, transport?: ApiTransport) {
    validateOptions(options);
    this.options = {
      ...options,
      baseUrl: normalizeBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL),
      bundleId: options.bundleId ?? "game.qualiarts.hololive.dreams.jp",
      lang: options.lang ?? "jpn",
      os: options.os ?? "Android",
      store: options.store ?? "GooglePlay",
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    };
    this.transport = transport ?? new Http2Transport();
    this.ownsTransport = transport === undefined;
    this.credential = options.credential;
    this.gameAuthToken = options.gameAuthToken;
    this.masterVersion = options.masterVersion;
    this.notice = new NoticeApi(this);
  }

  static async create(
    options: HolodoriApiOptions,
    transport?: ApiTransport,
  ): Promise<HolodoriApi> {
    const api = new HolodoriApi(options, transport);
    if (options.autoAuthenticate !== false) await api.authenticate();
    return api;
  }

  getCredential(): string | undefined {
    return this.credential;
  }

  getGameAuthToken(): string | undefined {
    return this.gameAuthToken;
  }

  getMasterVersion(): string | undefined {
    return this.masterVersion;
  }

  async authenticate(): Promise<AuthenticatedSession> {
    if (this.authentication) return this.authentication;
    this.authentication = this.authenticateInternal();
    try {
      return await this.authentication;
    } finally {
      this.authentication = undefined;
    }
  }

  close(): Promise<void> {
    if (this.ownsTransport) this.transport.close?.();
    return Promise.resolve();
  }

  async authCreate(): Promise<string> {
    const response = await this.call(
      "/rpc.api.Auth/Create",
      encodeEmpty(),
      false,
      false,
    );
    this.credential = decodeCredentialResponse(response);
    return this.credential;
  }

  async authLogin(credential = this.credential): Promise<string> {
    if (!credential)
      throw new HolodoriApiError(
        "credential is required for Auth/Login",
        "/rpc.api.Auth/Login",
      );
    const response = await this.call(
      "/rpc.api.Auth/Login",
      encodeCredentialRequest(credential),
      false,
      false,
    );
    this.credential = credential;
    this.gameAuthToken = decodeGameAuthTokenResponse(response);
    return this.gameAuthToken;
  }

  async masterGet(): Promise<string> {
    const response = await this.call(
      "/rpc.api.Master/Get",
      encodeEmpty(),
      false,
      false,
    );
    this.masterVersion = decodeMasterVersionResponse(response);
    return this.masterVersion;
  }

  async callNoticeTop(): Promise<NoticeTopResponse> {
    await this.ensureAuthenticated();
    const response = await this.call(
      "/rpc.api.Notice/Top",
      encodeEmpty(),
      true,
      true,
    );
    return decodeNoticeTopResponse(response);
  }

  async callNoticeListInCategory(
    categoryId: string,
    offset: number,
  ): Promise<NoticeListInCategoryResponse> {
    await this.ensureAuthenticated();
    const response = await this.call(
      "/rpc.api.Notice/ListInCategory",
      encodeListInCategoryRequest(categoryId, offset),
      true,
      true,
    );
    return decodeNoticeListInCategoryResponse(response);
  }

  async callNoticeGet(noticeId: string): Promise<NoticeGetResponse> {
    await this.ensureAuthenticated();
    const response = await this.call(
      "/rpc.api.Notice/Get",
      encodeNoticeGetRequest(noticeId),
      true,
      true,
    );
    return decodeNoticeGetResponse(response);
  }

  async callNoticeUpdateCategoryReadTime(
    categoryIds: readonly string[],
  ): Promise<NoticeUpdateResponse> {
    await this.ensureAuthenticated();
    const response = await this.call(
      "/rpc.api.Notice/UpdateCategoryReadTime",
      encodeStringListRequest(categoryIds, "notice category IDs"),
      true,
      true,
    );
    return decodeUpdateResponse(response);
  }

  async callNoticeUpdateDetailReadTime(
    noticeIds: readonly string[],
  ): Promise<NoticeUpdateResponse> {
    await this.ensureAuthenticated();
    const response = await this.call(
      "/rpc.api.Notice/UpdateDetailReadTime",
      encodeStringListRequest(noticeIds, "notice IDs"),
      true,
      true,
    );
    return decodeUpdateResponse(response);
  }

  private async authenticateInternal(): Promise<AuthenticatedSession> {
    if (!this.credential && !this.gameAuthToken) await this.authCreate();
    if (!this.gameAuthToken) await this.authLogin();
    if (!this.masterVersion) await this.masterGet();
    if (!this.gameAuthToken || !this.masterVersion) {
      throw new HolodoriApiError(
        "authentication did not produce a complete session",
        "bootstrap",
      );
    }
    return {
      credential: this.credential,
      gameAuthToken: this.gameAuthToken,
      masterVersion: this.masterVersion,
    };
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.gameAuthToken || !this.masterVersion) await this.authenticate();
  }

  private async call(
    path: string,
    proto: Buffer,
    authenticated: boolean,
    responseCache: boolean,
  ): Promise<Buffer> {
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
    if (authenticated) {
      if (!this.gameAuthToken || !this.masterVersion) {
        throw new HolodoriApiError(
          "authenticated API call requires a logged-in session",
          path,
        );
      }
      headers["x-app-auth-token"] = this.gameAuthToken;
      headers["x-app-master-version"] = this.masterVersion;
    }
    if (responseCache) headers["x-app-request-id"] = this.createRequestId();

    const result = await this.transport.request({
      method: "POST",
      url: `${this.options.baseUrl}${path}`,
      headers,
      body: encryptProto(proto, this.options.apiSecret),
      timeoutMs: this.options.timeoutMs,
    });
    if (result.status !== 200) {
      throw new HolodoriApiError(
        `${path} HTTP status ${result.status}`,
        path,
        result.status,
      );
    }
    assertGrpcSuccess({ ...result.headers }, { ...result.trailers }, path);
    return decryptProto(result.body, this.options.apiSecret);
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
    this.lastRequestTicks =
      now > this.lastRequestTicks ? now : this.lastRequestTicks + 1n;
    return this.lastRequestTicks.toString();
  }
}

export class NoticeApi {
  constructor(private readonly api: HolodoriApi) {}

  top(): Promise<NoticeTopResponse> {
    return this.api.callNoticeTop();
  }

  listInCategory(
    categoryId: string,
    offset: number,
  ): Promise<NoticeListInCategoryResponse> {
    return this.api.callNoticeListInCategory(categoryId, offset);
  }

  get(noticeId: string): Promise<NoticeGetResponse> {
    return this.api.callNoticeGet(noticeId);
  }

  updateCategoryReadTime(
    categoryIds: readonly string[],
  ): Promise<NoticeUpdateResponse> {
    return this.api.callNoticeUpdateCategoryReadTime(categoryIds);
  }

  updateDetailReadTime(
    noticeIds: readonly string[],
  ): Promise<NoticeUpdateResponse> {
    return this.api.callNoticeUpdateDetailReadTime(noticeIds);
  }
}

function validateOptions(options: HolodoriApiOptions): void {
  if (!options.appVersion) throw new TypeError("appVersion is required");
  if (!options.apiSecret) throw new TypeError("apiSecret is required");
  if (
    options.timeoutMs !== undefined &&
    (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0)
  ) {
    throw new RangeError("timeoutMs must be a positive finite number");
  }
  for (const [name, value] of Object.entries(options.additionalHeaders ?? {})) {
    if (!name || /[A-Z\s]/.test(name)) {
      throw new TypeError(
        "additionalHeaders names must be non-empty lowercase HTTP header names",
      );
    }
    if (typeof value !== "string" || /[\r\n]/.test(value)) {
      throw new TypeError(
        `additionalHeaders contains an invalid value for ${name}`,
      );
    }
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  const url = new URL(baseUrl);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new TypeError(
      "baseUrl must be an HTTPS origin without credentials or a path",
    );
  }
  return url.toString().replace(/\/$/, "");
}
