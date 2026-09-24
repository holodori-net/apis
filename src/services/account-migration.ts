import { type ApiClient } from "../core/client.js";
import { HolodoriApiError } from "../core/errors.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import { requireResponseString } from "../core/response.js";
import { type ApiSession } from "../core/session.js";
import {
  decodeProtobuf,
  encodeProtobuf,
  type ProtobufMessageInit,
} from "../protos/codec.js";
import {
  type AccountMigrationLinkResult,
  AccountMigrationMigrateRequestSchema,
  type AccountMigrationMigrateResponse,
  AccountMigrationMigrateResponseSchema,
  AccountMigrationPrepareMigrationPasswordRequestSchema,
  type AccountMigrationPrepareMigrationPasswordResponse,
  AccountMigrationPrepareMigrationPasswordResponseSchema,
} from "../protos/gen/rpc/api/account_migration.gen_pb.js";
import { normalizeBaseUrl, type RegionBaseUrlResolver } from "../region.js";

const PREPARE_PASSWORD: ApiMethod<
  { readonly accountMigrationId: string; readonly password: string },
  AccountMigrationPrepareMigrationPasswordResponse
> = {
  path: "/rpc.api.AccountMigration/PrepareMigrationPassword",
  requiresGameAuth: false,
  requiresMasterVersion: false,
  usesResponseCache: false,
  requiresRequestSignature: false,
  encode: (request) =>
    encodeProtobuf(AccountMigrationPrepareMigrationPasswordRequestSchema, {
      accountMigrationId: requireNonEmpty(
        request.accountMigrationId,
        "account migration ID",
      ),
      password: requireNonEmpty(request.password, "migration password"),
    }),
  decode: (response) =>
    decodeProtobuf(
      AccountMigrationPrepareMigrationPasswordResponseSchema,
      response,
    ),
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
  encode: (request) =>
    encodeProtobuf(AccountMigrationMigrateRequestSchema, {
      ...request,
      targetPublicUserId: requireNonEmpty(
        request.targetPublicUserId,
        "target public user ID",
      ),
      oneTimeToken: requireNonEmpty(request.oneTimeToken, "one-time token"),
    }),
  decode: (response) =>
    decodeProtobuf(AccountMigrationMigrateResponseSchema, response),
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
    options?: RequestOptions,
  ): Promise<AccountMigrationLinkResult> {
    const response = await this.preparePasswordResponse(
      accountMigrationId,
      password,
      options,
    );
    if (!response.linkResult) {
      throw new HolodoriApiError(
        "migration response has no link result",
        PREPARE_PASSWORD.path,
      );
    }
    return response.linkResult;
  }

  /** Returns the complete password-prepare response including its link result. @rpc /rpc.api.AccountMigration/PrepareMigrationPassword */
  preparePasswordResponse(
    accountMigrationId: string,
    password: string,
    options?: RequestOptions,
  ): Promise<AccountMigrationPrepareMigrationPasswordResponse> {
    return this.client.call(
      PREPARE_PASSWORD,
      { accountMigrationId, password },
      options,
    );
  }

  /** Exchanges a prepared one-time token for a persistent credential. @remarks A successful call replaces the credential held by this SDK session. @rpc /rpc.api.AccountMigration/Migrate */
  migrate(
    request: AccountMigrationMigrateRequest,
    options?: RequestOptions,
  ): Promise<AccountMigrationMigrateResponse>;
  migrate(
    targetPublicUserId: string,
    oneTimeToken: string,
    previousPublicUserId?: string,
    options?: RequestOptions,
  ): Promise<AccountMigrationMigrateResponse>;
  migrate(
    requestOrTargetPublicUserId: AccountMigrationMigrateRequest | string,
    oneTimeTokenOrOptions?: RequestOptions | string,
    previousPublicUserId?: string,
    options?: RequestOptions,
  ): Promise<AccountMigrationMigrateResponse> {
    const request: AccountMigrationMigrateRequest =
      typeof requestOrTargetPublicUserId === "string"
        ? {
            previousPublicUserId: previousPublicUserId ?? "",
            targetPublicUserId: requestOrTargetPublicUserId,
            oneTimeToken:
              typeof oneTimeTokenOrOptions === "string"
                ? oneTimeTokenOrOptions
                : "",
          }
        : requestOrTargetPublicUserId;
    const requestOptions =
      typeof requestOrTargetPublicUserId === "string"
        ? options
        : typeof oneTimeTokenOrOptions === "object"
          ? oneTimeTokenOrOptions
          : undefined;
    return this.migrateRequest(request, requestOptions);
  }

  /** Runs password preparation and credential migration, switching official regions when required. @remarks A successful call replaces the credential held by this SDK session. */
  async migrateWithPassword(
    accountMigrationId: string,
    password: string,
    previousPublicUserId?: string,
    options?: RequestOptions,
  ): Promise<AccountMigrationMigrateResponse> {
    const prepared = await this.preparePassword(
      accountMigrationId,
      password,
      options,
    );
    const linkedUserInfo = prepared.linkedUserInfo;
    if (!linkedUserInfo) {
      throw new HolodoriApiError(
        "migration response has no linked user info",
        PREPARE_PASSWORD.path,
      );
    }
    const request = {
      previousPublicUserId: previousPublicUserId ?? "",
      targetPublicUserId: linkedUserInfo.publicUserId,
      oneTimeToken: linkedUserInfo.oneTimeToken,
    } satisfies AccountMigrationMigrateRequest;
    const targetBaseUrl = this.resolveRegionBaseUrl(linkedUserInfo.region);
    const result = await this.migrateRequest(request, options, targetBaseUrl);
    if (targetBaseUrl) this.client.setBaseUrl(targetBaseUrl);
    return result;
  }

  private async migrateRequest(
    request: AccountMigrationMigrateRequest,
    options?: RequestOptions,
    baseUrl?: string,
  ): Promise<AccountMigrationMigrateResponse> {
    const result = await this.client.call(MIGRATE, request, {
      ...options,
      ...(baseUrl === undefined ? {} : { baseUrl }),
    });
    this.session.replaceCredentialAfterMigration(
      requireResponseString(result.credential, "credential", MIGRATE.path),
    );
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
export type {
  AccountMigrationLinkResult,
  AccountMigrationMigrateRequest,
  AccountMigrationMigrateResponse,
  AccountMigrationPrepareMigrationPasswordResponse,
};

type AccountMigrationMigrateRequest = ProtobufMessageInit<
  typeof AccountMigrationMigrateRequestSchema
>;

function requireNonEmpty(value: string | undefined, name: string): string {
  if (!value) throw new RangeError(`${name} must not be empty`);
  return value;
}
