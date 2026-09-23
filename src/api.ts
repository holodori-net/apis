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
import { type RequestOptions } from "./core/request-options.js";
import { ApiSession, type SessionSnapshot } from "./core/session.js";
import {
  isOfficialBaseUrl,
  normalizeBaseUrl,
  officialBaseUrlForRegion,
  type RegionBaseUrlResolver,
} from "./region.js";
import { AccountMigrationApi } from "./services/account-migration.js";
import { AssetApi } from "./services/asset.js";
import { AuthApi } from "./services/auth.js";
import { CardApi } from "./services/card.js";
import { ChaseApi } from "./services/chase.js";
import { CircuitApi } from "./services/circuit.js";
import { ComboCardGameApi } from "./services/combo-card-game.js";
import { EventApi } from "./services/event.js";
import { ExchangeApi } from "./services/exchange.js";
import { GachaApi } from "./services/gacha.js";
import { HealthApi } from "./services/health.js";
import { HomeApi } from "./services/home.js";
import { JumpRopeApi } from "./services/jump-rope.js";
import { LiveApi } from "./services/live.js";
import { MarathonApi } from "./services/marathon.js";
import { MasterApi } from "./services/master.js";
import { MembershipApi } from "./services/membership.js";
import { MusicCreativeChartApi } from "./services/music-creative-chart.js";
import { MusicApi } from "./services/music.js";
import { NoticeApi } from "./services/notice.js";
import { NotificationApi } from "./services/notification.js";
import { ProfileApi } from "./services/profile.js";
import { ShopApi } from "./services/shop.js";
import { SplashBallApi } from "./services/splash-ball.js";
import { SystemApi } from "./services/system.js";
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
  readonly asset: AssetApi;
  readonly card: CardApi;
  readonly chase: ChaseApi;
  readonly circuit: CircuitApi;
  readonly comboCardGame: ComboCardGameApi;
  readonly event: EventApi;
  readonly exchange: ExchangeApi;
  readonly gacha: GachaApi;
  readonly home: HomeApi;
  readonly health: HealthApi;
  readonly jumpRope: JumpRopeApi;
  readonly live: LiveApi;
  readonly marathon: MarathonApi;
  readonly master: MasterApi;
  readonly membership: MembershipApi;
  readonly notice: NoticeApi;
  readonly notification: NotificationApi;
  readonly music: MusicApi;
  readonly musicCreativeChart: MusicCreativeChartApi;
  readonly profile: ProfileApi;
  readonly shop: ShopApi;
  readonly splashBall: SplashBallApi;
  readonly system: SystemApi;
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
    this.asset = new AssetApi(this.client, () => this.authenticate());
    this.card = new CardApi(this.client, () => this.authenticate());
    this.chase = new ChaseApi(this.client, () => this.authenticate());
    this.circuit = new CircuitApi(this.client, () => this.authenticate());
    this.comboCardGame = new ComboCardGameApi(this.client, () =>
      this.authenticate(),
    );
    this.event = new EventApi(this.client, () => this.authenticate());
    this.exchange = new ExchangeApi(this.client, () => this.authenticate());
    this.gacha = new GachaApi(this.client, () => this.authenticate());
    this.home = new HomeApi(this.client, () => this.authenticate());
    this.health = new HealthApi(this.client);
    this.jumpRope = new JumpRopeApi(this.client, () => this.authenticate());
    this.live = new LiveApi(this.client, () => this.authenticate());
    this.marathon = new MarathonApi(this.client, () => this.authenticate());
    this.master = new MasterApi(this.client, this.session);
    this.membership = new MembershipApi(this.client, () => this.authenticate());
    this.notice = new NoticeApi(this.client, () => this.authenticate());
    this.notification = new NotificationApi(this.client, () =>
      this.authenticate(),
    );
    this.music = new MusicApi(this.client, () => this.authenticate());
    this.musicCreativeChart = new MusicCreativeChartApi(this.client, () =>
      this.authenticate(),
    );
    this.profile = new ProfileApi(this.client, () => this.authenticate());
    this.shop = new ShopApi(this.client, () => this.authenticate());
    this.splashBall = new SplashBallApi(this.client, () => this.authenticate());
    this.system = new SystemApi(this.client, this.session);
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
  authCreate(requestOptions?: RequestOptions): Promise<string> {
    return this.auth.create(requestOptions);
  }

  /** @deprecated Use `api.auth.login()`. */
  authLogin(
    credential?: string,
    requestOptions?: RequestOptions,
  ): Promise<string> {
    return this.auth.login(credential, requestOptions);
  }

  /** @deprecated Use `api.master.get()`. */
  masterGet(requestOptions?: RequestOptions): Promise<string> {
    return this.master.get(requestOptions);
  }

  /** @deprecated Use `api.accountMigration.preparePassword()`. */
  callAccountMigrationPreparePassword(
    accountMigrationId: string,
    password: string,
    requestOptions?: RequestOptions,
  ): Promise<AccountMigrationPreparePasswordResponse> {
    return this.accountMigration.preparePasswordResponse(
      accountMigrationId,
      password,
      requestOptions,
    );
  }

  /** @deprecated Use `api.accountMigration.migrate()`. */
  callAccountMigrationMigrate(
    request: AccountMigrationMigrateRequest,
    requestOptions?: RequestOptions,
  ): Promise<AccountMigrationMigrateResponse> {
    return this.accountMigration.migrate(request, requestOptions);
  }

  /** @deprecated Use `api.notice.top()`. */
  callNoticeTop(requestOptions?: RequestOptions): Promise<NoticeTopResponse> {
    return this.notice.top(requestOptions);
  }

  /** @deprecated Use `api.notice.listInCategory()`. */
  callNoticeListInCategory(
    categoryId: string,
    offset: number,
    requestOptions?: RequestOptions,
  ): Promise<NoticeListInCategoryResponse> {
    return this.notice.listInCategory(categoryId, offset, requestOptions);
  }

  /** @deprecated Use `api.notice.get()`. */
  callNoticeGet(
    noticeId: string,
    requestOptions?: RequestOptions,
  ): Promise<NoticeGetResponse> {
    return this.notice.get(noticeId, requestOptions);
  }

  /** @deprecated Use `api.notice.updateCategoryReadTime()`. */
  callNoticeUpdateCategoryReadTime(
    categoryIds: readonly string[],
    requestOptions?: RequestOptions,
  ): Promise<NoticeUpdateResponse> {
    return this.notice.updateCategoryReadTime(categoryIds, requestOptions);
  }

  /** @deprecated Use `api.notice.updateDetailReadTime()`. */
  callNoticeUpdateDetailReadTime(
    noticeIds: readonly string[],
    requestOptions?: RequestOptions,
  ): Promise<NoticeUpdateResponse> {
    return this.notice.updateDetailReadTime(noticeIds, requestOptions);
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

export {
  AccountMigrationApi,
  AssetApi,
  AuthApi,
  ChaseApi,
  CircuitApi,
  ComboCardGameApi,
  EventApi,
  ExchangeApi,
  GachaApi,
  HealthApi,
  HolodoriApiError,
  JumpRopeApi,
  MarathonApi,
  MasterApi,
  MembershipApi,
  MusicApi,
  MusicCreativeChartApi,
  NoticeApi,
  NotificationApi,
  ProfileApi,
  ShopApi,
  SplashBallApi,
  SystemApi,
};
