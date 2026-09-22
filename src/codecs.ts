import {
  decodeProtoFields,
  encodeMessage,
  encodeStringField,
  encodeVarintField,
  firstBool,
  firstBytes,
  firstString,
  firstUint,
  type ProtoValue,
  requireString,
} from "./protobuf.js";

export interface NoticeInfo {
  readonly id: string;
  readonly title: string;
  readonly type: number;
  readonly detailUrl: string;
  readonly bannerAssetId: string;
  readonly isRead: boolean;
  readonly startTime: bigint;
  readonly externalUrl: string;
}

export interface NoticeCategory {
  readonly noticeCategoryId: string;
  readonly name: string;
  readonly displayType: number;
  readonly noticeInfos: readonly NoticeInfo[];
  readonly isHasNext: boolean;
}

export interface NoticeTopResponse {
  readonly categories: readonly NoticeCategory[];
}

export interface NoticeListInCategoryResponse {
  readonly noticeInfos: readonly NoticeInfo[];
  readonly isHasNext: boolean;
}

export interface NoticeGetResponse {
  readonly noticeInfo: NoticeInfo;
}

export interface NoticeUpdateResponse {
  readonly commonResponse?: unknown;
}

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

export function encodeEmpty(): Buffer {
  return Buffer.alloc(0);
}

export function encodeCredentialRequest(credential: string): Buffer {
  return encodeMessage(
    encodeStringField(1, requireNonEmpty(credential, "credential")),
  );
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

export function encodeListInCategoryRequest(
  categoryId: string,
  offset: number,
): Buffer {
  if (!Number.isInteger(offset) || offset < 0) {
    throw new RangeError(
      "notice category offset must be a non-negative integer",
    );
  }
  return encodeMessage(
    encodeStringField(1, requireNonEmpty(categoryId, "notice category ID")),
    encodeVarintField(2, offset),
  );
}

export function encodeNoticeGetRequest(noticeId: string): Buffer {
  return encodeMessage(
    encodeStringField(1, requireNonEmpty(noticeId, "notice ID")),
  );
}

export function encodeStringListRequest(
  values: readonly string[],
  name: string,
): Buffer {
  if (values.length === 0) throw new RangeError(`${name} must not be empty`);
  const unique = new Set(values);
  if (unique.size !== values.length)
    throw new RangeError(`${name} must be unique`);
  return encodeMessage(
    ...values.map((value) =>
      encodeStringField(1, requireNonEmpty(value, name)),
    ),
  );
}

export function decodeCredentialResponse(data: Buffer): string {
  return requireString(decodeProtoFields(data), 1, "credential");
}

export function decodeGameAuthTokenResponse(data: Buffer): string {
  return requireString(decodeProtoFields(data), 1, "game auth token");
}

export function decodeMasterVersionResponse(data: Buffer): string {
  return requireString(decodeProtoFields(data), 1, "master version");
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

export function decodeNoticeTopResponse(data: Buffer): NoticeTopResponse {
  const fields = decodeProtoFields(data);
  return {
    categories: (fields.get(1) ?? [])
      .filter(isBuffer)
      .map(decodeNoticeCategory),
  };
}

export function decodeNoticeListInCategoryResponse(
  data: Buffer,
): NoticeListInCategoryResponse {
  const fields = decodeProtoFields(data);
  return {
    noticeInfos: (fields.get(1) ?? []).filter(isBuffer).map(decodeNoticeInfo),
    isHasNext: firstBool(fields, 5),
  };
}

export function decodeNoticeGetResponse(data: Buffer): NoticeGetResponse {
  const notice = (decodeProtoFields(data).get(1) ?? []).find(isBuffer);
  if (!notice) throw new Error("Notice/Get response has no notice_info field");
  return { noticeInfo: decodeNoticeInfo(notice) };
}

export function decodeUpdateResponse(data: Buffer): NoticeUpdateResponse {
  void data;
  return {};
}

function decodeNoticeCategory(data: Buffer): NoticeCategory {
  const fields = decodeProtoFields(data);
  return {
    noticeCategoryId: requireString(fields, 1, "notice category ID"),
    name: firstString(fields, 2) ?? "",
    displayType: toSafeNumber(firstUint(fields, 3) ?? 0n, "display type"),
    noticeInfos: (fields.get(4) ?? []).filter(isBuffer).map(decodeNoticeInfo),
    isHasNext: firstBool(fields, 5),
  };
}

function decodeNoticeInfo(data: Buffer): NoticeInfo {
  const fields = decodeProtoFields(data);
  return {
    id: requireString(fields, 1, "notice ID"),
    title: firstString(fields, 2) ?? "",
    type: toSafeNumber(firstUint(fields, 3) ?? 0n, "notice type"),
    detailUrl: firstString(fields, 4) ?? "",
    bannerAssetId: firstString(fields, 5) ?? "",
    isRead: firstBool(fields, 6),
    startTime: firstUint(fields, 7) ?? 0n,
    externalUrl: firstString(fields, 8) ?? "",
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

function isBuffer(value: ProtoValue): value is Buffer {
  return Buffer.isBuffer(value);
}

function requireNonEmpty(value: string, name: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new RangeError(`${name} must not be empty`);
  }
  return value;
}

function toSafeNumber(value: bigint, name: string): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(`${name} exceeds JavaScript safe integer range`);
  }
  return Number(value);
}
