import {
  firstBool,
  firstInt32,
  firstInt64,
  firstString,
  type ProtoValue,
} from "../protobuf.js";
import { encodeBytesField, encodeVarintField } from "../protobuf.js";
import {
  decodeProtoFields,
  encodeMessage,
  encodeStringField,
  isBuffer,
  requireNonEmpty,
  toSafeNumber,
} from "./common.js";
import {
  decodeProfileBasicUserInfo,
  type ProfileBasicUserInfo,
} from "./profile.js";
import {
  type BasicRankingRankInfo,
  decodeBasicRankingRankInfo,
  decodeRankingLiveDeckInfo,
  type RankingLiveDeckInfo,
} from "./ranking.js";

export interface MusicCreativeChartSearchParameter {
  readonly isSearchAllMusic?: boolean;
  readonly musicIds?: readonly string[];
  readonly isQuoteAllowedOnly?: boolean;
  readonly resetIntervalType?: number;
  readonly textSearchTypes?: readonly number[];
  readonly searchText?: string;
  readonly difficultyValueFrom?: number;
  readonly difficultyValueTo?: number;
  readonly chartTypes?: readonly number[];
  readonly musicCreativeChartTagIds?: readonly string[];
}

export interface MusicCreativeChartInfo {
  readonly musicCreativeChartId: string;
  readonly musicId: string;
  readonly creatorUserName: string;
  readonly isFavorite: boolean;
  readonly title: string;
  readonly thumbnailImageUrl: string;
  readonly difficultyValue: number;
  readonly chartTypes: readonly number[];
  readonly musicCreativeChartTagIds: readonly string[];
  readonly fullComboNoteCount: number;
  readonly normalNoteCount: number;
  readonly flickNoteCount: number;
  readonly longNoteCount: number;
  readonly likeCount: bigint;
  readonly playCount: bigint;
  readonly publishType: number;
  readonly liveResultType: number;
  readonly previewImageUrl: string;
  readonly isOwn: boolean;
}

export interface MusicCreativeChartInfoMusicGrouping {
  readonly musicId: string;
  readonly chartInfos: readonly MusicCreativeChartInfo[];
}

export interface MusicCreativeChartCreatorInfo {
  readonly userInfo?: ProfileBasicUserInfo;
  readonly publishedChartCount: bigint;
  readonly totalLikeCount: bigint;
}

export interface MusicCreativeChartListRequest {
  readonly searchParameter?: MusicCreativeChartSearchParameter;
}

export interface MusicCreativeChartListResponse {
  readonly chartInfoMusicGroupings: readonly MusicCreativeChartInfoMusicGrouping[];
}

export interface MusicCreativeChartListByCreatorRequest {
  readonly publicUserId: string;
  readonly searchParameter?: MusicCreativeChartSearchParameter;
}

export interface MusicCreativeChartListByCreatorResponse {
  readonly chartInfos: readonly MusicCreativeChartInfo[];
}

export interface MusicCreativeChartListPopularCreatorRequest {
  readonly resetIntervalType?: number;
}

export interface MusicCreativeChartListPopularCreatorResponse {
  readonly creatorInfos: readonly MusicCreativeChartCreatorInfo[];
}

export interface MusicCreativeChartGetByIdRequest {
  readonly musicCreativeChartId: string;
  readonly isQuoteAllowedOnly?: boolean;
}

export interface MusicCreativeChartGetByIdResponse {
  readonly chartInfo?: MusicCreativeChartInfo;
}

export interface MusicCreativeChartGetQuoteTargetChartRequest {
  readonly musicCreativeChartId: string;
}

export interface MusicCreativeChartGetQuoteTargetChartResponse {
  readonly chartFileUrl: string;
}

export interface MusicCreativeChartGetCreatorInfoRequest {
  readonly musicCreativeChartId: string;
}

export interface MusicCreativeChartGetCreatorInfoResponse {
  readonly creatorUserInfo?: ProfileBasicUserInfo;
  readonly relatedCreatorPublicUserIds: readonly string[];
  readonly relatedCreatorUserInfos: readonly ProfileBasicUserInfo[];
}

export interface MusicCreativeChartGetEarlyClearRankingInfoRequest {
  readonly musicCreativeChartId: string;
  readonly liveResultType: number;
}

export interface MusicCreativeChartGetEarlyClearRankingInfoResponse {
  readonly rankInfos: readonly BasicRankingRankInfo[];
  readonly selfRankingRank: number;
}

export interface MusicCreativeChartGetEarlyClearLiveDeckRequest {
  readonly publicUserId: string;
  readonly musicCreativeChartId: string;
  readonly liveResultType: number;
}

export interface MusicCreativeChartGetEarlyClearLiveDeckResponse {
  readonly rankingLiveDeckInfo?: RankingLiveDeckInfo;
}

export function encodeMusicCreativeChartListRequest(
  request: MusicCreativeChartListRequest,
): Buffer {
  if (request.searchParameter !== undefined)
    validateSearchParameter(request.searchParameter);
  return request.searchParameter === undefined
    ? Buffer.alloc(0)
    : encodeMessage(
        encodeBytesField(
          1,
          encodeMusicCreativeChartSearchParameter(request.searchParameter),
        ),
      );
}

export function encodeMusicCreativeChartListByCreatorRequest(
  request: MusicCreativeChartListByCreatorRequest,
): Buffer {
  if (request.searchParameter !== undefined)
    validateSearchParameter(request.searchParameter);
  return encodeMessage(
    encodeStringField(
      1,
      requireNonEmpty(request.publicUserId, "public user ID"),
    ),
    ...(request.searchParameter === undefined
      ? []
      : [
          encodeBytesField(
            2,
            encodeMusicCreativeChartSearchParameter(request.searchParameter),
          ),
        ]),
  );
}

export function encodeMusicCreativeChartListPopularCreatorRequest(
  request: MusicCreativeChartListPopularCreatorRequest,
): Buffer {
  if (request.resetIntervalType !== undefined)
    requireNonNegativeInteger(request.resetIntervalType, "reset interval type");
  return request.resetIntervalType === undefined
    ? Buffer.alloc(0)
    : encodeMessage(encodeVarintField(1, request.resetIntervalType));
}

export function encodeMusicCreativeChartGetByIdRequest(
  request: MusicCreativeChartGetByIdRequest,
): Buffer {
  return encodeMessage(
    encodeStringField(
      1,
      requireNonEmpty(request.musicCreativeChartId, "music creative chart ID"),
    ),
    ...(request.isQuoteAllowedOnly === undefined
      ? []
      : [encodeVarintField(2, request.isQuoteAllowedOnly ? 1 : 0)]),
  );
}

export function encodeMusicCreativeChartIdRequest(
  request:
    | MusicCreativeChartGetCreatorInfoRequest
    | MusicCreativeChartGetQuoteTargetChartRequest,
): Buffer {
  return encodeMessage(
    encodeStringField(
      1,
      requireNonEmpty(request.musicCreativeChartId, "music creative chart ID"),
    ),
  );
}

export function encodeMusicCreativeChartGetEarlyClearRankingInfoRequest(
  request: MusicCreativeChartGetEarlyClearRankingInfoRequest,
): Buffer {
  requirePositiveInteger(request.liveResultType, "live result type");
  return encodeMessage(
    encodeStringField(
      1,
      requireNonEmpty(request.musicCreativeChartId, "music creative chart ID"),
    ),
    encodeVarintField(2, request.liveResultType),
  );
}

export function encodeMusicCreativeChartGetEarlyClearLiveDeckRequest(
  request: MusicCreativeChartGetEarlyClearLiveDeckRequest,
): Buffer {
  requirePositiveInteger(request.liveResultType, "live result type");
  return encodeMessage(
    encodeStringField(
      1,
      requireNonEmpty(request.publicUserId, "public user ID"),
    ),
    encodeStringField(
      2,
      requireNonEmpty(request.musicCreativeChartId, "music creative chart ID"),
    ),
    encodeVarintField(3, request.liveResultType),
  );
}

export function decodeMusicCreativeChartListResponse(
  data: Buffer,
): MusicCreativeChartListResponse {
  return {
    chartInfoMusicGroupings: decodeRepeated(
      decodeProtoFields(data),
      1,
      decodeMusicCreativeChartInfoMusicGrouping,
    ),
  };
}

export function decodeMusicCreativeChartListByCreatorResponse(
  data: Buffer,
): MusicCreativeChartListByCreatorResponse {
  return {
    chartInfos: decodeRepeated(
      decodeProtoFields(data),
      1,
      decodeMusicCreativeChartInfo,
    ),
  };
}

export function decodeMusicCreativeChartListPopularCreatorResponse(
  data: Buffer,
): MusicCreativeChartListPopularCreatorResponse {
  return {
    creatorInfos: decodeRepeated(
      decodeProtoFields(data),
      1,
      decodeMusicCreativeChartCreatorInfo,
    ),
  };
}

export function decodeMusicCreativeChartGetByIdResponse(
  data: Buffer,
): MusicCreativeChartGetByIdResponse {
  const chartInfo = firstMessage(decodeProtoFields(data), 1);
  return chartInfo === undefined
    ? {}
    : { chartInfo: decodeMusicCreativeChartInfo(chartInfo) };
}

export function decodeMusicCreativeChartGetQuoteTargetChartResponse(
  data: Buffer,
): MusicCreativeChartGetQuoteTargetChartResponse {
  return { chartFileUrl: firstString(decodeProtoFields(data), 1) ?? "" };
}

export function decodeMusicCreativeChartGetCreatorInfoResponse(
  data: Buffer,
): MusicCreativeChartGetCreatorInfoResponse {
  const fields = decodeProtoFields(data);
  const creator = firstMessage(fields, 1);
  return {
    ...(creator === undefined
      ? {}
      : { creatorUserInfo: decodeProfileBasicUserInfo(creator) }),
    relatedCreatorPublicUserIds: decodeRepeatedStrings(fields, 2),
    relatedCreatorUserInfos: decodeRepeated(
      fields,
      3,
      decodeProfileBasicUserInfo,
    ),
  };
}

export function decodeMusicCreativeChartGetEarlyClearRankingInfoResponse(
  data: Buffer,
): MusicCreativeChartGetEarlyClearRankingInfoResponse {
  const fields = decodeProtoFields(data);
  return {
    rankInfos: decodeRepeated(fields, 1, decodeBasicRankingRankInfo),
    selfRankingRank: firstInt32(fields, 2) ?? 0,
  };
}

export function decodeMusicCreativeChartGetEarlyClearLiveDeckResponse(
  data: Buffer,
): MusicCreativeChartGetEarlyClearLiveDeckResponse {
  const deck = firstMessage(decodeProtoFields(data), 1);
  return deck === undefined
    ? {}
    : { rankingLiveDeckInfo: decodeRankingLiveDeckInfo(deck) };
}

function encodeMusicCreativeChartSearchParameter(
  request: MusicCreativeChartSearchParameter,
): Buffer {
  return encodeMessage(
    ...(request.isSearchAllMusic === undefined
      ? []
      : [encodeVarintField(1, request.isSearchAllMusic ? 1 : 0)]),
    ...(request.musicIds ?? []).map((id) =>
      encodeStringField(2, requireNonEmpty(id, "music ID")),
    ),
    ...(request.isQuoteAllowedOnly === undefined
      ? []
      : [encodeVarintField(3, request.isQuoteAllowedOnly ? 1 : 0)]),
    ...(request.resetIntervalType === undefined
      ? []
      : [encodeVarintField(4, request.resetIntervalType)]),
    ...(request.textSearchTypes ?? []).map((value) =>
      encodeVarintField(5, value),
    ),
    ...(request.searchText === undefined
      ? []
      : [encodeStringField(6, request.searchText)]),
    ...(request.difficultyValueFrom === undefined
      ? []
      : [encodeVarintField(7, request.difficultyValueFrom)]),
    ...(request.difficultyValueTo === undefined
      ? []
      : [encodeVarintField(8, request.difficultyValueTo)]),
    ...(request.chartTypes ?? []).map((value) => encodeVarintField(9, value)),
    ...(request.musicCreativeChartTagIds ?? []).map((id) =>
      encodeStringField(10, requireNonEmpty(id, "music creative chart tag ID")),
    ),
  );
}

function validateSearchParameter(
  request: MusicCreativeChartSearchParameter,
): void {
  validateUniqueNonEmptyStrings(request.musicIds ?? [], "music IDs");
  validateUniqueNonEmptyStrings(
    request.musicCreativeChartTagIds ?? [],
    "music creative chart tag IDs",
  );
  validateUniquePositiveIntegers(
    request.textSearchTypes ?? [],
    "text search types",
  );
  validateUniquePositiveIntegers(request.chartTypes ?? [], "chart types");
  if (request.resetIntervalType !== undefined) {
    requireNonNegativeInteger(request.resetIntervalType, "reset interval type");
  }
  if (request.difficultyValueFrom !== undefined) {
    requireNonNegativeInteger(
      request.difficultyValueFrom,
      "minimum difficulty value",
    );
  }
  if (request.difficultyValueTo !== undefined) {
    requireNonNegativeInteger(
      request.difficultyValueTo,
      "maximum difficulty value",
    );
  }
  if (
    request.difficultyValueFrom !== undefined &&
    request.difficultyValueTo !== undefined &&
    request.difficultyValueFrom > request.difficultyValueTo
  ) {
    throw new RangeError(
      "minimum difficulty value must not exceed maximum difficulty value",
    );
  }
}

function validateUniqueNonEmptyStrings(
  values: readonly string[],
  name: string,
): void {
  const seen = new Set<string>();
  for (const value of values) {
    requireNonEmpty(value, name);
    if (seen.has(value)) throw new RangeError(`${name} must be unique`);
    seen.add(value);
  }
}

function validateUniquePositiveIntegers(
  values: readonly number[],
  name: string,
): void {
  const seen = new Set<number>();
  for (const value of values) {
    requirePositiveInteger(value, name);
    if (seen.has(value)) throw new RangeError(`${name} must be unique`);
    seen.add(value);
  }
}

function requirePositiveInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value <= 0)
    throw new RangeError(`${name} must be a positive integer`);
}

function requireNonNegativeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new RangeError(`${name} must be a non-negative integer`);
}

function decodeMusicCreativeChartInfoMusicGrouping(
  data: Buffer,
): MusicCreativeChartInfoMusicGrouping {
  const fields = decodeProtoFields(data);
  return {
    musicId: firstString(fields, 1) ?? "",
    chartInfos: decodeRepeated(fields, 2, decodeMusicCreativeChartInfo),
  };
}

function decodeMusicCreativeChartInfo(data: Buffer): MusicCreativeChartInfo {
  const fields = decodeProtoFields(data);
  return {
    musicCreativeChartId: firstString(fields, 1) ?? "",
    musicId: firstString(fields, 2) ?? "",
    creatorUserName: firstString(fields, 3) ?? "",
    isFavorite: firstBool(fields, 4),
    title: firstString(fields, 5) ?? "",
    thumbnailImageUrl: firstString(fields, 6) ?? "",
    difficultyValue: firstInt32(fields, 7) ?? 0,
    chartTypes: decodeRepeatedNumbers(fields, 8),
    musicCreativeChartTagIds: decodeRepeatedStrings(fields, 9),
    fullComboNoteCount: firstInt32(fields, 10) ?? 0,
    normalNoteCount: firstInt32(fields, 11) ?? 0,
    flickNoteCount: firstInt32(fields, 12) ?? 0,
    longNoteCount: firstInt32(fields, 13) ?? 0,
    likeCount: firstInt64(fields, 14) ?? 0n,
    playCount: firstInt64(fields, 15) ?? 0n,
    publishType: firstInt32(fields, 16) ?? 0,
    liveResultType: firstInt32(fields, 17) ?? 0,
    previewImageUrl: firstString(fields, 18) ?? "",
    isOwn: firstBool(fields, 19),
  };
}

function decodeMusicCreativeChartCreatorInfo(
  data: Buffer,
): MusicCreativeChartCreatorInfo {
  const fields = decodeProtoFields(data);
  const userInfo = firstMessage(fields, 1);
  return {
    ...(userInfo === undefined
      ? {}
      : { userInfo: decodeProfileBasicUserInfo(userInfo) }),
    publishedChartCount: firstInt64(fields, 2) ?? 0n,
    totalLikeCount: firstInt64(fields, 3) ?? 0n,
  };
}

function decodeRepeated<T>(
  fields: Map<number, ProtoValue[]>,
  field: number,
  decode: (value: Buffer) => T,
): T[] {
  return (fields.get(field) ?? []).filter(isBuffer).map(decode);
}

function firstMessage(
  fields: Map<number, ProtoValue[]>,
  field: number,
): Buffer | undefined {
  const value = fields.get(field)?.[0];
  return Buffer.isBuffer(value) ? value : undefined;
}

function decodeRepeatedStrings(
  fields: Map<number, ProtoValue[]>,
  field: number,
): string[] {
  return (fields.get(field) ?? [])
    .filter(isBuffer)
    .map((value) => value.toString("utf8"));
}

function decodeRepeatedNumbers(
  fields: Map<number, ProtoValue[]>,
  field: number,
): number[] {
  const values: number[] = [];
  for (const value of fields.get(field) ?? []) {
    if (typeof value === "bigint") {
      values.push(toSafeNumber(value, `music creative chart field ${field}`));
    } else {
      values.push(...decodePackedNumbers(value));
    }
  }
  return values;
}

function decodePackedNumbers(data: Buffer): number[] {
  const values: number[] = [];
  let offset = 0;
  while (offset < data.length) {
    let value = 0n;
    let shift = 0n;
    while (true) {
      const byte = data[offset++];
      if (byte === undefined || shift > 63n) {
        throw new Error("malformed packed protobuf enum");
      }
      value |= BigInt(byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) break;
      shift += 7n;
    }
    values.push(toSafeNumber(value, "packed music creative chart enum"));
  }
  return values;
}
