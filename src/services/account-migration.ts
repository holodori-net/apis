import {
  type AccountMigrationLinkResult,
  type AccountMigrationMigrateRequest,
  type AccountMigrationMigrateResponse,
  type AccountMigrationPreparePasswordResponse,
  decodeAccountMigrationMigrateResponse,
  decodeAccountMigrationPreparePasswordResponse,
  encodeMigrateRequest,
  encodePrepareMigrationPasswordRequest,
} from "../codecs/account-migration.js";
import { type ApiClient, HolodoriApiError } from "../core/client.js";
import { type ApiMethod } from "../core/method.js";
import { type ApiSession } from "../core/session.js";
import { normalizeBaseUrl, type RegionBaseUrlResolver } from "../region.js";

const PREPARE_PASSWORD: ApiMethod<
  { readonly accountMigrationId: string; readonly password: string },
  AccountMigrationPreparePasswordResponse
> = {
  path: "/rpc.api.AccountMigration/PrepareMigrationPassword",
  requiresGameAuth: false,
  requiresMasterVersion: false,
  usesResponseCache: false,
  requiresRequestSignature: false,
  encode: ({ accountMigrationId, password }) =>
    encodePrepareMigrationPasswordRequest(accountMigrationId, password),
  decode: decodeAccountMigrationPreparePasswordResponse,
};

const MIGRATE: ApiMethod<
  AccountMigrationMigrateRequest,
  AccountMigrationMigrateResponse
> = {
  path: "/rpc.api.AccountMigration/Migrate",
  requiresGameAuth: false,
  requiresMasterVersion: false,
  usesResponseCache: false,
  requiresRequestSignature: false,
  encode: encodeMigrateRequest,
  decode: decodeAccountMigrationMigrateResponse,
};

export interface AccountMigrationApiOptions {
  readonly resolveRegionBaseUrl?: RegionBaseUrlResolver;
}

/** Prepares and completes account migration without requiring an active game session. */
export class AccountMigrationApi {
  constructor(
    private readonly client: ApiClient,
    private readonly session: ApiSession,
    private readonly options: AccountMigrationApiOptions = {},
  ) {}

  /** Verifies a linking ID and password and returns the target account preview. @rpc /rpc.api.AccountMigration/PrepareMigrationPassword */
  async preparePassword(
    accountMigrationId: string,
    password: string,
  ): Promise<AccountMigrationLinkResult> {
    return (await this.preparePasswordResponse(accountMigrationId, password))
      .linkResult;
  }

  /** Returns the complete password-prepare response including its link result. @rpc /rpc.api.AccountMigration/PrepareMigrationPassword */
  async preparePasswordResponse(
    accountMigrationId: string,
    password: string,
  ): Promise<AccountMigrationPreparePasswordResponse> {
    return this.client.call(PREPARE_PASSWORD, { accountMigrationId, password });
  }

  /** Exchanges a prepared one-time token for a persistent credential. @remarks A successful call replaces the credential held by this SDK session. @rpc /rpc.api.AccountMigration/Migrate */
  migrate(
    request: AccountMigrationMigrateRequest,
  ): Promise<AccountMigrationMigrateResponse>;
  migrate(
    targetPublicUserId: string,
    oneTimeToken: string,
    previousPublicUserId?: string,
  ): Promise<AccountMigrationMigrateResponse>;
  migrate(
    requestOrTargetPublicUserId: AccountMigrationMigrateRequest | string,
    oneTimeToken?: string,
    previousPublicUserId?: string,
  ): Promise<AccountMigrationMigrateResponse> {
    const request =
      typeof requestOrTargetPublicUserId === "string"
        ? {
            targetPublicUserId: requestOrTargetPublicUserId,
            oneTimeToken: oneTimeToken ?? "",
            ...(previousPublicUserId === undefined
              ? {}
              : { previousPublicUserId }),
          }
        : requestOrTargetPublicUserId;
    return this.migrateRequest(request);
  }

  /** Runs password preparation and credential migration, switching official regions when required. @remarks A successful call replaces the credential held by this SDK session. */
  async migrateWithPassword(
    accountMigrationId: string,
    password: string,
    previousPublicUserId?: string,
  ): Promise<AccountMigrationMigrateResponse> {
    const prepared = await this.preparePassword(accountMigrationId, password);
    const linkedUserInfo = prepared.linkedUserInfo;
    if (!linkedUserInfo) {
      throw new HolodoriApiError(
        "migration response has no linked user info",
        PREPARE_PASSWORD.path,
      );
    }
    const request = {
      ...(previousPublicUserId === undefined ? {} : { previousPublicUserId }),
      targetPublicUserId: linkedUserInfo.publicUserId,
      oneTimeToken: linkedUserInfo.oneTimeToken,
    };
    const targetBaseUrl = this.resolveRegionBaseUrl(linkedUserInfo.region);
    const result = await this.migrateRequest(request, targetBaseUrl);
    if (targetBaseUrl) this.client.setBaseUrl(targetBaseUrl);
    return result;
  }

  private async migrateRequest(
    request: AccountMigrationMigrateRequest,
    baseUrl?: string,
  ): Promise<AccountMigrationMigrateResponse> {
    const result = await this.client.call(MIGRATE, request, baseUrl);
    this.session.replaceCredentialAfterMigration(result.credential);
    return result;
  }

  private resolveRegionBaseUrl(region: number): string | undefined {
    const resolver = this.options.resolveRegionBaseUrl;
    if (!resolver) return undefined;
    const resolved = resolver(region);
    if (resolved === undefined) {
      throw new HolodoriApiError(
        `unsupported migration region ${region}`,
        PREPARE_PASSWORD.path,
      );
    }
    return normalizeBaseUrl(resolved);
  }
}

export { MIGRATE, PREPARE_PASSWORD };
