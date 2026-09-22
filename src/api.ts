import {
  type AccountMigrationMigrateRequest,
  type AccountMigrationMigrateResponse,
  type AccountMigrationPreparePasswordResponse,
  type NoticeGetResponse,
  type NoticeListInCategoryResponse,
  type NoticeTopResponse,
  type NoticeUpdateResponse,
} from "./codecs.js";
import {
  ApiClient,
  DEFAULT_TIMEOUT_MS,
  HolodoriApiError,
} from "./core/client.js";
import { type RequestSigner } from "./core/method.js";
import { ApiSession, type SessionSnapshot } from "./core/session.js";
import {
  isOfficialBaseUrl,
  normalizeBaseUrl,
  officialBaseUrlForRegion,
  type RegionBaseUrlResolver,
} from "./region.js";
import { AccountMigrationApi } from "./services/account-migration.js";
import { AuthApi } from "./services/auth.js";
import { CardApi } from "./services/card.js";
import { LiveApi } from "./services/live.js";
import { MasterApi } from "./services/master.js";
import { NoticeApi } from "./services/notice.js";
import { UserApi } from "./services/user.js";
import { type ApiTransport, Http2Transport } from "./transport.js";

const DEFAULT_BASE_URL = "https://jp.game-hololive-dreams.com";

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
  readonly requestSigner?: RequestSigner;
  readonly timeoutMs?: number;
  readonly autoAuthenticate?: boolean;
  readonly regionBaseUrlResolver?: RegionBaseUrlResolver;
}

export interface AuthenticatedSession {
  readonly credential: string | undefined;
  readonly gameAuthToken: string;
  readonly masterVersion: string;
}

export class HolodoriApi {
  readonly auth: AuthApi;
  readonly card: CardApi;
  readonly live: LiveApi;
  readonly master: MasterApi;
  readonly notice: NoticeApi;
  readonly user: UserApi;
  readonly accountMigration: AccountMigrationApi;

  private readonly client: ApiClient;
  private readonly session: ApiSession;
  private authentication: Promise<AuthenticatedSession> | undefined;

  constructor(options: HolodoriApiOptions, transport?: ApiTransport) {
    validateOptions(options);
    const baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL);
    const ownsTransport = transport === undefined;
    const actualTransport = transport ?? new Http2Transport();
    this.session = new ApiSession({
      credential: options.credential,
      gameAuthToken: options.gameAuthToken,
      masterVersion: options.masterVersion,
    });
    this.client = new ApiClient(
      {
        appVersion: options.appVersion,
        apiSecret: options.apiSecret,
        baseUrl,
        bundleId: options.bundleId ?? "game.qualiarts.hololive.dreams.jp",
        lang: options.lang ?? "jpn",
        os: options.os ?? "Android",
        store: options.store ?? "GooglePlay",
        ...(options.additionalHeaders === undefined
          ? {}
          : { additionalHeaders: options.additionalHeaders }),
        ...(options.requestIdFactory === undefined
          ? {}
          : { requestIdFactory: options.requestIdFactory }),
        ...(options.requestSigner === undefined
          ? {}
          : { requestSigner: options.requestSigner }),
        timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      },
      this.session,
      actualTransport,
      ownsTransport,
    );
    this.auth = new AuthApi(this.client, this.session);
    this.card = new CardApi(this.client, () => this.authenticate());
    this.live = new LiveApi(this.client, () => this.authenticate());
    this.master = new MasterApi(this.client, this.session);
    this.notice = new NoticeApi(this.client, () => this.authenticate());
    this.user = new UserApi(this.client, () => this.authenticate());
    const regionBaseUrlResolver = options.regionBaseUrlResolver;
    this.accountMigration = new AccountMigrationApi(
      this.client,
      this.session,
      regionBaseUrlResolver
        ? { resolveRegionBaseUrl: regionBaseUrlResolver }
        : isOfficialBaseUrl(baseUrl)
          ? { resolveRegionBaseUrl: officialBaseUrlForRegion }
          : {},
    );
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
    return this.session.credentialValue;
  }

  getGameAuthToken(): string | undefined {
    return this.session.gameAuthTokenValue;
  }

  getMasterVersion(): string | undefined {
    return this.session.masterVersionValue;
  }

  getSession(): SessionSnapshot {
    return this.session.snapshot;
  }

  async authenticate(): Promise<AuthenticatedSession> {
    if (this.authentication) return this.authentication;
    const authentication = this.authenticateInternal();
    this.authentication = authentication;
    try {
      return await authentication;
    } finally {
      if (this.authentication === authentication)
        this.authentication = undefined;
      // Authentication is intentionally not memoized: callers can retry after
      // a transient failure while the session values remain reusable.
    }
  }

  close(): Promise<void> {
    this.client.close();
    return Promise.resolve();
  }

  /** @deprecated Use `api.auth.create()`. */
  authCreate(): Promise<string> {
    return this.auth.create();
  }

  /** @deprecated Use `api.auth.login()`. */
  authLogin(credential?: string): Promise<string> {
    return this.auth.login(credential);
  }

  /** @deprecated Use `api.master.get()`. */
  masterGet(): Promise<string> {
    return this.master.get();
  }

  /** @deprecated Use `api.accountMigration.preparePassword()`. */
  callAccountMigrationPreparePassword(
    accountMigrationId: string,
    password: string,
  ): Promise<AccountMigrationPreparePasswordResponse> {
    return this.accountMigration.preparePasswordResponse(
      accountMigrationId,
      password,
    );
  }

  /** @deprecated Use `api.accountMigration.migrate()`. */
  callAccountMigrationMigrate(
    request: AccountMigrationMigrateRequest,
  ): Promise<AccountMigrationMigrateResponse> {
    return this.accountMigration.migrate(request);
  }

  /** @deprecated Use `api.notice.top()`. */
  callNoticeTop(): Promise<NoticeTopResponse> {
    return this.notice.top();
  }

  /** @deprecated Use `api.notice.listInCategory()`. */
  callNoticeListInCategory(
    categoryId: string,
    offset: number,
  ): Promise<NoticeListInCategoryResponse> {
    return this.notice.listInCategory(categoryId, offset);
  }

  /** @deprecated Use `api.notice.get()`. */
  callNoticeGet(noticeId: string): Promise<NoticeGetResponse> {
    return this.notice.get(noticeId);
  }

  /** @deprecated Use `api.notice.updateCategoryReadTime()`. */
  callNoticeUpdateCategoryReadTime(
    categoryIds: readonly string[],
  ): Promise<NoticeUpdateResponse> {
    return this.notice.updateCategoryReadTime(categoryIds);
  }

  /** @deprecated Use `api.notice.updateDetailReadTime()`. */
  callNoticeUpdateDetailReadTime(
    noticeIds: readonly string[],
  ): Promise<NoticeUpdateResponse> {
    return this.notice.updateDetailReadTime(noticeIds);
  }

  private async authenticateInternal(): Promise<AuthenticatedSession> {
    if (!this.session.credentialValue && !this.session.gameAuthTokenValue)
      await this.auth.create();
    if (!this.session.gameAuthTokenValue) await this.auth.login();
    if (!this.session.masterVersionValue) await this.master.get();
    const gameAuthToken = this.session.gameAuthTokenValue;
    const masterVersion = this.session.masterVersionValue;
    if (!gameAuthToken || !masterVersion) {
      throw new HolodoriApiError(
        "authentication did not produce a complete session",
        "bootstrap",
      );
    }
    return {
      credential: this.session.credentialValue,
      gameAuthToken,
      masterVersion,
    };
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

export { AccountMigrationApi, AuthApi, HolodoriApiError, MasterApi, NoticeApi };
