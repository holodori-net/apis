import {
  encodeVarintField,
  firstBool,
  firstInt32,
  firstInt64,
  firstString,
  firstUint,
} from "../protobuf.js";
import {
  decodeProtoFields,
  encodeMessage,
  isBuffer,
  toSafeNumber,
} from "./common.js";

/** Gift ordering accepted by Gift/List. */
export enum GiftSortType {
  PostedTime = 1,
  LimitTime = 2,
}

export interface GiftListRequest {
  readonly offset: number;
  readonly sortType: GiftSortType;
  readonly isDesc: boolean;
}

export interface GiftListResponse {
  readonly items: readonly GiftItem[];
  readonly count: number;
  readonly isNext: boolean;
}

export interface GiftItem {
  readonly giftId: string;
  readonly resourceType: number;
  readonly resourceId: string;
  readonly quantity: bigint;
  readonly description: string;
  readonly postedTime: bigint;
  readonly limitTime: bigint;
}

/** Encodes the Gift/List request. */
export function encodeGiftListRequest(request: GiftListRequest): Buffer {
  requireNonNegativeInt32(request.offset, "offset");
  if (
    request.sortType !== GiftSortType.PostedTime &&
    request.sortType !== GiftSortType.LimitTime
  ) {
    throw new RangeError("sortType must be PostedTime or LimitTime");
  }
  if (typeof request.isDesc !== "boolean")
    throw new TypeError("isDesc must be a boolean");

  return encodeMessage(
    encodeVarintField(1, request.offset),
    encodeVarintField(2, request.sortType),
    encodeVarintField(3, request.isDesc ? 1 : 0),
  );
}

function requireNonNegativeInt32(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0 || value > 2_147_483_647)
    throw new RangeError(`${name} must be a non-negative int32`);
}

/** Decodes all business fields in a Gift/List response. */
export function decodeGiftListResponse(data: Buffer): GiftListResponse {
  const fields = decodeProtoFields(data);
  return {
    items: (fields.get(1) ?? []).filter(isBuffer).map(decodeGiftItem),
    count: firstInt32(fields, 2) ?? 0,
    isNext: firstBool(fields, 3),
  };
}

function decodeGiftItem(data: Buffer): GiftItem {
  const fields = decodeProtoFields(data);
  return {
    giftId: firstString(fields, 1) ?? "",
    resourceType: toSafeNumber(firstUint(fields, 2) ?? 0n, "resource type"),
    resourceId: firstString(fields, 3) ?? "",
    quantity: firstInt64(fields, 4) ?? 0n,
    description: firstString(fields, 5) ?? "",
    postedTime: firstInt64(fields, 6) ?? 0n,
    limitTime: firstInt64(fields, 7) ?? 0n,
  };
}
