import {
  encodeStringField,
  firstBool,
  firstString,
  firstUint,
  requireString,
} from "../protobuf.js";
import {
  decodeProtoFields,
  encodeMessage,
  isBuffer,
  requireNonEmpty,
  toSafeNumber,
} from "./common.js";
import {
  type CommonConsumption,
  type CommonReward,
  decodeCommonConsumption,
  decodeCommonReward,
} from "./resource.js";

export interface ExchangeResponse {
  readonly id: string;
  readonly name: string;
  readonly booths: readonly ExchangeBooth[];
  readonly backgroundAssetId: string;
  readonly headerAssetId: string;
  readonly logoAssetId: string;
  readonly pegboardColor: string;
  readonly hookColor: string;
  readonly iconAssetId: string;
  readonly color1: string;
  readonly color2: string;
  readonly color3: string;
  readonly color4: string;
}

export interface ExchangeBooth {
  readonly id: string;
  readonly name: string;
  readonly type: number;
  readonly items: readonly ExchangeItem[];
  readonly nextResetTime: bigint;
  readonly endTime: bigint;
  /** Account-specific unlock state. */
  readonly isLocked: boolean;
  readonly unlockConditionGroupId: string;
}

export interface ExchangeItem {
  readonly type: number;
  readonly id: string;
  readonly name: string;
  readonly thumbnailAssetId: string;
  readonly limitQuantity: number;
  /** Account-specific number already purchased. */
  readonly purchasedQuantity: number;
  readonly consumptions: readonly ExchangeConsumption[];
  readonly rewards: readonly CommonReward[];
  readonly nextResetTime: bigint;
  readonly endTime: bigint;
  /** Account-specific unlock state. */
  readonly isLocked: boolean;
  readonly unlockConditionGroupId: string;
  readonly description: string;
  readonly resetIntervalType: number;
  readonly releaseTime: bigint;
}

export interface ExchangeConsumption extends CommonConsumption {
  readonly originalQuantity: bigint;
  readonly discountRatioPermil: number;
}

export type ExchangeReward = CommonReward;

export function encodeExchangeListRequest(boothGroupId: string): Buffer {
  return encodeMessage(
    encodeStringField(
      1,
      requireNonEmpty(boothGroupId, "exchange booth group ID"),
    ),
  );
}

export function decodeExchangeListResponse(data: Buffer): ExchangeResponse {
  const fields = decodeProtoFields(data);
  return {
    id: requireString(fields, 1, "exchange group ID"),
    name: firstString(fields, 2) ?? "",
    booths: (fields.get(3) ?? []).filter(isBuffer).map(decodeBooth),
    backgroundAssetId: firstString(fields, 4) ?? "",
    headerAssetId: firstString(fields, 5) ?? "",
    logoAssetId: firstString(fields, 6) ?? "",
    pegboardColor: firstString(fields, 7) ?? "",
    hookColor: firstString(fields, 8) ?? "",
    iconAssetId: firstString(fields, 9) ?? "",
    color1: firstString(fields, 100) ?? "",
    color2: firstString(fields, 101) ?? "",
    color3: firstString(fields, 102) ?? "",
    color4: firstString(fields, 103) ?? "",
  };
}

function decodeBooth(data: Buffer): ExchangeBooth {
  const fields = decodeProtoFields(data);
  return {
    id: firstString(fields, 1) ?? "",
    name: firstString(fields, 2) ?? "",
    type: toSafeNumber(firstUint(fields, 3) ?? 0n, "exchange booth type"),
    items: (fields.get(4) ?? []).filter(isBuffer).map(decodeItem),
    nextResetTime: firstUint(fields, 5) ?? 0n,
    endTime: firstUint(fields, 6) ?? 0n,
    isLocked: firstBool(fields, 7),
    unlockConditionGroupId: firstString(fields, 8) ?? "",
  };
}

function decodeItem(data: Buffer): ExchangeItem {
  const fields = decodeProtoFields(data);
  return {
    type: toSafeNumber(firstUint(fields, 1) ?? 0n, "exchange item type"),
    id: firstString(fields, 2) ?? "",
    name: firstString(fields, 3) ?? "",
    thumbnailAssetId: firstString(fields, 4) ?? "",
    limitQuantity: toSafeNumber(
      firstUint(fields, 5) ?? 0n,
      "exchange item limit quantity",
    ),
    purchasedQuantity: toSafeNumber(
      firstUint(fields, 6) ?? 0n,
      "exchange item purchased quantity",
    ),
    consumptions: (fields.get(7) ?? []).filter(isBuffer).map(decodeConsumption),
    rewards: (fields.get(8) ?? []).filter(isBuffer).map(decodeReward),
    nextResetTime: firstUint(fields, 9) ?? 0n,
    endTime: firstUint(fields, 10) ?? 0n,
    isLocked: firstBool(fields, 11),
    unlockConditionGroupId: firstString(fields, 12) ?? "",
    description: firstString(fields, 13) ?? "",
    resetIntervalType: toSafeNumber(
      firstUint(fields, 14) ?? 0n,
      "exchange item reset interval type",
    ),
    releaseTime: firstUint(fields, 15) ?? 0n,
  };
}

function decodeConsumption(data: Buffer): ExchangeConsumption {
  const fields = decodeProtoFields(data);
  return {
    ...decodeCommonConsumption(data),
    originalQuantity: firstUint(fields, 4) ?? 0n,
    discountRatioPermil: toSafeNumber(
      firstUint(fields, 5) ?? 0n,
      "exchange discount ratio permil",
    ),
  };
}

function decodeReward(data: Buffer): CommonReward {
  return decodeCommonReward(data);
}
