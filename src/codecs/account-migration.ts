import { firstBool, firstBytes, firstString, firstUint } from "../protobuf.js";
import {
  decodeProtoFields,
  encodeMessage,
  encodeStringField,
  requireNonEmpty,
  requireString,
  toSafeNumber,
} from "./common.js";

export interface AccountMigrationLinkedUserInfo {
  readonly publicUserId: string;
  readonly userName: string;
  readonly playerLevel: number;
  readonly oneTimeToken: string;
  readonly region: number;
}

export interface AccountMigrationLinkResult {
  readonly isAlreadyLinked: boolean;
  readonly linkedUserInfo: AccountMigrationLinkedUserInfo | undefined;
}

export interface AccountMigrationPreparePasswordResponse {
  readonly linkResult: AccountMigrationLinkResult;
}

export interface AccountMigrationMigrateRequest {
  readonly previousPublicUserId?: string;
  readonly targetPublicUserId: string;
  readonly oneTimeToken: string;
}

export interface AccountMigrationMigrateResponse {
  readonly credential: string;
  readonly accountMigrationId: string;
}

export function encodePrepareMigrationPasswordRequest(
  accountMigrationId: string,
  password: string,
): Buffer {
  return encodeMessage(
    encodeStringField(
      1,
      requireNonEmpty(accountMigrationId, "account migration ID"),
    ),
    encodeStringField(2, requireNonEmpty(password, "migration password")),
  );
}

export function encodeMigrateRequest(
  request: AccountMigrationMigrateRequest,
): Buffer {
  const previousPublicUserId = request.previousPublicUserId;
  return encodeMessage(
    ...(previousPublicUserId
      ? [encodeStringField(1, previousPublicUserId)]
      : []),
    encodeStringField(
      2,
      requireNonEmpty(request.targetPublicUserId, "target public user ID"),
    ),
    encodeStringField(
      3,
      requireNonEmpty(request.oneTimeToken, "one-time token"),
    ),
  );
}

export function decodeAccountMigrationPreparePasswordResponse(
  data: Buffer,
): AccountMigrationPreparePasswordResponse {
  const linkResult = firstBytes(decodeProtoFields(data), 1);
  if (!linkResult) {
    throw new Error(
      "AccountMigration/PrepareMigrationPassword response has no link_result field",
    );
  }
  return { linkResult: decodeAccountMigrationLinkResult(linkResult) };
}

export function decodeAccountMigrationMigrateResponse(
  data: Buffer,
): AccountMigrationMigrateResponse {
  const fields = decodeProtoFields(data);
  return {
    credential: requireString(fields, 1, "migration credential"),
    accountMigrationId: firstString(fields, 2) ?? "",
  };
}

function decodeAccountMigrationLinkResult(
  data: Buffer,
): AccountMigrationLinkResult {
  const fields = decodeProtoFields(data);
  const linkedUserInfo = firstBytes(fields, 2);
  return {
    isAlreadyLinked: firstBool(fields, 1),
    linkedUserInfo: linkedUserInfo
      ? decodeAccountMigrationLinkedUserInfo(linkedUserInfo)
      : undefined,
  };
}

function decodeAccountMigrationLinkedUserInfo(
  data: Buffer,
): AccountMigrationLinkedUserInfo {
  const fields = decodeProtoFields(data);
  return {
    publicUserId: requireString(fields, 1, "linked public user ID"),
    userName: firstString(fields, 2) ?? "",
    playerLevel: toSafeNumber(firstUint(fields, 3) ?? 0n, "player level"),
    oneTimeToken: requireString(fields, 4, "migration one-time token"),
    region: toSafeNumber(firstUint(fields, 5) ?? 0n, "region"),
  };
}
