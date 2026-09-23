import {
  firstBool,
  firstString,
  firstUint,
  requireString,
} from "../protobuf.js";
import {
  decodeProtoFields,
  encodeEmpty,
  isBuffer,
  toSafeNumber,
} from "./common.js";
import {
  type CommonConsumption,
  type CommonReward,
  decodeCommonConsumption,
  decodeCommonReward,
} from "./resource.js";

export type ShopConsumption = CommonConsumption;
export type ShopReward = CommonReward;

export interface ShopResponse {
  readonly shops: readonly ShopInfo[];
}

export interface ShopInfo {
  readonly id: string;
  readonly items: readonly ShopItem[];
  readonly type: number;
  readonly name: string;
  readonly endTime: bigint;
  readonly resetIntervalType: number;
  readonly nextResetTime: bigint;
  readonly thumbnailAssetId: string;
  readonly descriptionTitle: string;
  readonly descriptionText: string;
  readonly displayPossessionResourceTypes: readonly number[];
  readonly displayPossessionResourceIds: readonly string[];
}

export interface ShopItem {
  readonly type: number;
  readonly consumptionItem?: ShopConsumptionItem;
  readonly chargeItem?: ShopChargeItem;
}

export interface ShopConsumptionItem {
  readonly id: string;
  readonly name: string;
  readonly consumption: ShopConsumption;
  readonly discountPermilDown: number;
  readonly discountedQuantity: bigint;
  readonly rewards: readonly ShopReward[];
  /** Account-specific availability. */
  readonly isUnlocked: boolean;
  readonly unlockConditionGroupId: string;
  readonly endTime: bigint;
  readonly resetIntervalType: number;
  readonly nextResetTime: bigint;
  readonly limitCount: number;
  /** Account-specific purchase count. */
  readonly purchasedCount: number;
  readonly assetId: string;
  readonly lastResetTime: bigint;
  readonly isBackgroundSpecial: boolean;
  readonly color: string;
  /** Account-specific new-item indicator. */
  readonly isNew: boolean;
  readonly isEnableMultiplePurchase: boolean;
}

export interface ShopChargeItem {
  readonly id: string;
  readonly type: number;
  readonly consumable?: ShopChargeItemConsumable;
  readonly subscription?: ShopChargeItemSubscription;
}

export interface ShopChargeItemConsumable {
  readonly name: string;
  readonly providePaidStoneQuantity: number;
  readonly rewards: readonly ShopReward[];
  /** Account-specific availability. */
  readonly isUnlocked: boolean;
  readonly unlockConditionGroupId: string;
  readonly endTime: bigint;
  readonly resetIntervalType: number;
  readonly nextResetTime: bigint;
  readonly limitCount: number;
  /** Account-specific purchase count. */
  readonly purchasedCount: number;
  readonly assetId: string;
  readonly lastResetTime: bigint;
  readonly isBackgroundSpecial: boolean;
  readonly color: string;
  /** Account-specific new-item indicator. */
  readonly isNew: boolean;
  readonly appleIapProductId: string;
  readonly googleIapProductId: string;
  readonly steamMtxProductId: string;
  readonly steamPrice: string;
}

export interface ShopChargeItemSubscription {
  readonly type: number;
  /** Account-specific availability and subscription state. */
  readonly isUnlocked: boolean;
  readonly unlockConditionGroupId: string;
  readonly isSubscribed: boolean;
  readonly providePaidStoneQuantity: number;
  readonly appleIapProductId: string;
  readonly googleIapProductId: string;
}

export function encodeShopListRequest(): Buffer {
  return encodeEmpty();
}

export function encodeMembershipGetShopRequest(): Buffer {
  return encodeEmpty();
}

export function decodeShopListResponse(data: Buffer): ShopResponse {
  const fields = decodeProtoFields(data);
  return {
    shops: (fields.get(1) ?? []).filter(isBuffer).map(decodeShopInfo),
  };
}

export function decodeMembershipGetShopResponse(data: Buffer): ShopInfo {
  const shop = decodeProtoFields(data).get(1)?.find(isBuffer);
  if (!shop) throw new Error("Membership/GetShop response has no shop field");
  return decodeShopInfo(shop);
}

function decodeShopInfo(data: Buffer): ShopInfo {
  const fields = decodeProtoFields(data);
  return {
    id: requireString(fields, 1, "shop ID"),
    items: (fields.get(2) ?? []).filter(isBuffer).map(decodeShopItem),
    type: toSafeNumber(firstUint(fields, 3) ?? 0n, "shop type"),
    name: firstString(fields, 4) ?? "",
    endTime: firstUint(fields, 5) ?? 0n,
    resetIntervalType: toSafeNumber(
      firstUint(fields, 6) ?? 0n,
      "shop reset interval type",
    ),
    nextResetTime: firstUint(fields, 7) ?? 0n,
    thumbnailAssetId: firstString(fields, 8) ?? "",
    descriptionTitle: firstString(fields, 9) ?? "",
    descriptionText: firstString(fields, 10) ?? "",
    displayPossessionResourceTypes: (fields.get(11) ?? []).flatMap((value) =>
      (typeof value === "bigint" ? [value] : decodePackedVarints(value)).map(
        (item) => toSafeNumber(item, "possession resource type"),
      ),
    ),
    displayPossessionResourceIds: (fields.get(12) ?? [])
      .filter((value): value is Buffer => Buffer.isBuffer(value))
      .map((value) => value.toString("utf8")),
  };
}

function decodeShopItem(data: Buffer): ShopItem {
  const fields = decodeProtoFields(data);
  const consumptionItem = fields.get(2)?.find(isBuffer);
  const chargeItem = fields.get(3)?.find(isBuffer);
  return {
    type: toSafeNumber(firstUint(fields, 1) ?? 0n, "shop item type"),
    ...(consumptionItem === undefined
      ? {}
      : { consumptionItem: decodeShopConsumptionItem(consumptionItem) }),
    ...(chargeItem === undefined
      ? {}
      : { chargeItem: decodeShopChargeItem(chargeItem) }),
  };
}

function decodeShopConsumptionItem(data: Buffer): ShopConsumptionItem {
  const fields = decodeProtoFields(data);
  const consumption = fields.get(3)?.find(isBuffer);
  if (!consumption) throw new Error("shop consumption item has no consumption");
  return {
    id: firstString(fields, 1) ?? "",
    name: firstString(fields, 2) ?? "",
    ...decodeDiscountedConsumption(consumption),
    rewards: (fields.get(4) ?? []).filter(isBuffer).map(decodeShopReward),
    isUnlocked: firstBool(fields, 5),
    unlockConditionGroupId: firstString(fields, 6) ?? "",
    endTime: firstUint(fields, 7) ?? 0n,
    resetIntervalType: toSafeNumber(
      firstUint(fields, 8) ?? 0n,
      "consumption item reset interval type",
    ),
    nextResetTime: firstUint(fields, 9) ?? 0n,
    limitCount: toSafeNumber(firstUint(fields, 10) ?? 0n, "limit count"),
    purchasedCount: toSafeNumber(
      firstUint(fields, 11) ?? 0n,
      "purchased count",
    ),
    assetId: firstString(fields, 12) ?? "",
    lastResetTime: firstUint(fields, 13) ?? 0n,
    isBackgroundSpecial: firstBool(fields, 14),
    color: firstString(fields, 15) ?? "",
    isNew: firstBool(fields, 16),
    isEnableMultiplePurchase: firstBool(fields, 17),
  };
}

function decodeDiscountedConsumption(data: Buffer): {
  readonly consumption: ShopConsumption;
  readonly discountPermilDown: number;
  readonly discountedQuantity: bigint;
} {
  const fields = decodeProtoFields(data);
  const consumption = fields.get(1)?.find(isBuffer);
  if (!consumption) throw new Error("shop consumption has no resource cost");
  return {
    consumption: decodeShopConsumption(consumption),
    discountPermilDown: toSafeNumber(
      firstUint(fields, 2) ?? 0n,
      "discount permil down",
    ),
    discountedQuantity: firstUint(fields, 3) ?? 0n,
  };
}

function decodeShopChargeItem(data: Buffer): ShopChargeItem {
  const fields = decodeProtoFields(data);
  const consumable = fields.get(3)?.find(isBuffer);
  const subscription = fields.get(4)?.find(isBuffer);
  return {
    id: firstString(fields, 1) ?? "",
    type: toSafeNumber(firstUint(fields, 2) ?? 0n, "shop charge item type"),
    ...(consumable === undefined
      ? {}
      : { consumable: decodeShopChargeItemConsumable(consumable) }),
    ...(subscription === undefined
      ? {}
      : { subscription: decodeShopChargeItemSubscription(subscription) }),
  };
}

function decodeShopChargeItemConsumable(
  data: Buffer,
): ShopChargeItemConsumable {
  const fields = decodeProtoFields(data);
  return {
    name: firstString(fields, 1) ?? "",
    providePaidStoneQuantity: toSafeNumber(
      firstUint(fields, 4) ?? 0n,
      "paid stone quantity",
    ),
    rewards: (fields.get(5) ?? []).filter(isBuffer).map(decodeShopReward),
    isUnlocked: firstBool(fields, 6),
    unlockConditionGroupId: firstString(fields, 7) ?? "",
    endTime: firstUint(fields, 10) ?? 0n,
    resetIntervalType: toSafeNumber(
      firstUint(fields, 11) ?? 0n,
      "charge item reset interval type",
    ),
    nextResetTime: firstUint(fields, 12) ?? 0n,
    limitCount: toSafeNumber(firstUint(fields, 13) ?? 0n, "limit count"),
    purchasedCount: toSafeNumber(
      firstUint(fields, 14) ?? 0n,
      "purchased count",
    ),
    assetId: firstString(fields, 15) ?? "",
    lastResetTime: firstUint(fields, 16) ?? 0n,
    isBackgroundSpecial: firstBool(fields, 17),
    color: firstString(fields, 18) ?? "",
    isNew: firstBool(fields, 19),
    appleIapProductId: firstString(fields, 100) ?? "",
    googleIapProductId: firstString(fields, 101) ?? "",
    steamMtxProductId: firstString(fields, 102) ?? "",
    steamPrice: firstString(fields, 200) ?? "",
  };
}

function decodeShopChargeItemSubscription(
  data: Buffer,
): ShopChargeItemSubscription {
  const fields = decodeProtoFields(data);
  return {
    type: toSafeNumber(firstUint(fields, 1) ?? 0n, "subscription type"),
    isUnlocked: firstBool(fields, 4),
    unlockConditionGroupId: firstString(fields, 5) ?? "",
    isSubscribed: firstBool(fields, 6),
    providePaidStoneQuantity: toSafeNumber(
      firstUint(fields, 7) ?? 0n,
      "subscription paid stone quantity",
    ),
    appleIapProductId: firstString(fields, 100) ?? "",
    googleIapProductId: firstString(fields, 101) ?? "",
  };
}

function decodeShopConsumption(data: Buffer): ShopConsumption {
  return decodeCommonConsumption(data);
}

function decodeShopReward(data: Buffer): ShopReward {
  return decodeCommonReward(data);
}

function decodePackedVarints(data: Buffer): bigint[] {
  const values: bigint[] = [];
  let value = 0n;
  let shift = 0n;
  for (const byte of data) {
    value |= BigInt(byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) {
      values.push(value);
      value = 0n;
      shift = 0n;
    } else {
      shift += 7n;
      if (shift > 63n)
        throw new Error("malformed packed possession resource type");
    }
  }
  if (shift !== 0n)
    throw new Error("malformed packed possession resource type");
  return values;
}
