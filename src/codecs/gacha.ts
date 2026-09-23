import {
  encodeStringField,
  firstBool,
  firstString,
  firstUint,
  type ProtoValue,
} from "../protocol/protobuf.js";
import {
  decodeProtoFields,
  encodeEmpty,
  encodeMessage,
  isBuffer,
  requireNonEmpty,
  requireString,
  toSafeNumber,
} from "./common.js";
import {
  type CommonConsumption,
  type CommonReward,
  decodeCommonConsumption,
  decodeCommonReward,
} from "./resource.js";

export interface GachaListResponse {
  readonly gachaGroups: readonly GachaGroup[];
}

export interface GachaGroup {
  readonly gachaGroupId: string;
  readonly iconAssetId: string;
  readonly gachas: readonly GachaInfo[];
}

export interface GachaInfo {
  readonly gachaId: string;
  readonly type: number;
  readonly name: string;
  /** Whether this Gacha is locked for the authenticated account. */
  readonly isLocked: boolean;
  readonly unlockConditionGroupId: string;
  readonly startTime: bigint;
  readonly endTime: bigint;
  readonly detailNoticeId: string;
  readonly precaution: string;
  readonly iconAssetId: string;
  readonly pickupCardIds: readonly string[];
  readonly promotionPickupCardIds: readonly string[];
  readonly promotionMovieAssetId: string;
  readonly promotionImageAssetId: string;
  readonly isDisplayPromotionPickupCardRandom: boolean;
  readonly gachaButtons: readonly GachaButton[];
  readonly gachaPoint?: GachaPoint;
  readonly cardBonuses: readonly GachaCardBonus[];
  readonly cardSelect?: GachaCardSelect;
  readonly isEndTimeHidden: boolean;
  readonly gachaAnimationGroupingId: string;
  readonly gachaAnimationMovieGroupId: string;
  readonly gachaAnimationAssetId: string;
  /** Account-specific time at which this Gacha was last read. */
  readonly readTime: bigint;
  readonly bgmAssetId: string;
  readonly isPromotionPickupCardMovie: boolean;
  readonly fixedSlotName: string;
  readonly promotionText: string;
  readonly promotionSubText: string;
  readonly termLimitedHours: number;
}

export interface GachaButton {
  readonly gachaButtonId: string;
  readonly name: string;
  readonly description: string;
  /** Whether this draw option is disabled for the authenticated account. */
  readonly isDisabled: boolean;
  readonly consumptions: readonly GachaConsumption[];
  readonly bonusRewards: readonly GachaReward[];
  readonly limitCount: number;
  readonly resetIntervalType: number;
  readonly totalRewardPickCount: number;
  readonly fixedRewardPickCount: number;
  /** Account-specific number of times this draw option has been used. */
  readonly drawnCount: number;
  readonly priority: number;
}

export type GachaConsumption = CommonConsumption;

export type GachaReward = CommonReward;

export interface GachaPoint {
  readonly gachaPointId: string;
  /** Account-specific points accumulated for this Gacha. */
  readonly quantity: number;
}

export interface GachaCardBonus {
  readonly cardId: string;
  readonly rewards: readonly GachaReward[];
}

export interface GachaCardSelect {
  readonly selectableCardIds: readonly string[];
  readonly selectableCardQuantity: number;
  /** Account-specific card selections, when returned by the server. */
  readonly selectedCardIds: readonly string[];
}

export interface GachaListProbabilityResponse {
  readonly normalRarityProbabilities: readonly GachaRarityProbability[];
  readonly fixedRarityProbabilities: readonly GachaRarityProbability[];
}

export interface GachaRarityProbability {
  readonly rarity: number;
  /** Probability in parts per ten million; 10000 represents 0.1%. */
  readonly partsPerTenMillionProbability: number;
  readonly cardProbabilities: readonly GachaCardProbability[];
}

export interface GachaCardProbability {
  readonly cardId: string;
  /** Probability in parts per ten million; retained as an integer. */
  readonly partsPerTenMillionProbability: number;
  readonly isRateUp: boolean;
}

export function encodeGachaListRequest(): Buffer {
  return encodeEmpty();
}

export function encodeGachaListProbabilityRequest(gachaId: string): Buffer {
  return encodeMessage(
    encodeStringField(1, requireNonEmpty(gachaId, "Gacha ID")),
  );
}

export function decodeGachaListResponse(data: Buffer): GachaListResponse {
  const fields = decodeProtoFields(data);
  return {
    gachaGroups: (fields.get(1) ?? []).filter(isBuffer).map(decodeGachaGroup),
  };
}

export function decodeGachaListProbabilityResponse(
  data: Buffer,
): GachaListProbabilityResponse {
  const fields = decodeProtoFields(data);
  return {
    normalRarityProbabilities: (fields.get(1) ?? [])
      .filter(isBuffer)
      .map(decodeRarityProbability),
    fixedRarityProbabilities: (fields.get(2) ?? [])
      .filter(isBuffer)
      .map(decodeRarityProbability),
  };
}

function decodeGachaGroup(data: Buffer): GachaGroup {
  const fields = decodeProtoFields(data);
  return {
    gachaGroupId: requireString(fields, 1, "Gacha group ID"),
    iconAssetId: firstString(fields, 2) ?? "",
    gachas: (fields.get(3) ?? []).filter(isBuffer).map(decodeGachaInfo),
  };
}

function decodeGachaInfo(data: Buffer): GachaInfo {
  const fields = decodeProtoFields(data);
  const point = findMessage(fields, 17);
  const cardSelect = findMessage(fields, 19);
  return {
    gachaId: requireString(fields, 1, "Gacha ID"),
    type: numberField(fields, 2, "Gacha type"),
    name: firstString(fields, 3) ?? "",
    isLocked: firstBool(fields, 4),
    unlockConditionGroupId: firstString(fields, 5) ?? "",
    startTime: firstUint(fields, 6) ?? 0n,
    endTime: firstUint(fields, 7) ?? 0n,
    detailNoticeId: firstString(fields, 8) ?? "",
    precaution: firstString(fields, 9) ?? "",
    iconAssetId: firstString(fields, 10) ?? "",
    pickupCardIds: stringList(fields, 11),
    promotionPickupCardIds: stringList(fields, 12),
    promotionMovieAssetId: firstString(fields, 13) ?? "",
    promotionImageAssetId: firstString(fields, 14) ?? "",
    isDisplayPromotionPickupCardRandom: firstBool(fields, 15),
    gachaButtons: (fields.get(16) ?? [])
      .filter(isBuffer)
      .map(decodeGachaButton),
    ...(point === undefined ? {} : { gachaPoint: decodeGachaPoint(point) }),
    cardBonuses: (fields.get(18) ?? []).filter(isBuffer).map(decodeCardBonus),
    ...(cardSelect === undefined
      ? {}
      : { cardSelect: decodeCardSelect(cardSelect) }),
    isEndTimeHidden: firstBool(fields, 20),
    gachaAnimationGroupingId: firstString(fields, 21) ?? "",
    gachaAnimationMovieGroupId: firstString(fields, 22) ?? "",
    gachaAnimationAssetId: firstString(fields, 23) ?? "",
    readTime: firstUint(fields, 24) ?? 0n,
    bgmAssetId: firstString(fields, 25) ?? "",
    isPromotionPickupCardMovie: firstBool(fields, 26),
    fixedSlotName: firstString(fields, 27) ?? "",
    promotionText: firstString(fields, 28) ?? "",
    promotionSubText: firstString(fields, 29) ?? "",
    termLimitedHours: numberField(fields, 30, "term limited hours"),
  };
}

function decodeGachaButton(data: Buffer): GachaButton {
  const fields = decodeProtoFields(data);
  return {
    gachaButtonId: firstString(fields, 1) ?? "",
    name: firstString(fields, 2) ?? "",
    description: firstString(fields, 3) ?? "",
    isDisabled: firstBool(fields, 4),
    consumptions: (fields.get(5) ?? [])
      .filter(isBuffer)
      .map(decodeCommonConsumption),
    bonusRewards: (fields.get(6) ?? [])
      .filter(isBuffer)
      .map(decodeCommonReward),
    limitCount: numberField(fields, 7, "draw limit count"),
    resetIntervalType: numberField(fields, 8, "reset interval type"),
    totalRewardPickCount: numberField(fields, 9, "total reward pick count"),
    fixedRewardPickCount: numberField(fields, 10, "fixed reward pick count"),
    drawnCount: numberField(fields, 11, "drawn count"),
    priority: numberField(fields, 12, "Gacha button priority"),
  };
}

function decodeGachaPoint(data: Buffer): GachaPoint {
  const fields = decodeProtoFields(data);
  return {
    gachaPointId: firstString(fields, 1) ?? "",
    quantity: numberField(fields, 2, "Gacha point quantity"),
  };
}

function decodeCardBonus(data: Buffer): GachaCardBonus {
  const fields = decodeProtoFields(data);
  return {
    cardId: firstString(fields, 1) ?? "",
    rewards: (fields.get(2) ?? []).filter(isBuffer).map(decodeCommonReward),
  };
}

function decodeCardSelect(data: Buffer): GachaCardSelect {
  const fields = decodeProtoFields(data);
  return {
    selectableCardIds: stringList(fields, 1),
    selectableCardQuantity: numberField(fields, 2, "selectable card quantity"),
    selectedCardIds: stringList(fields, 3),
  };
}

function decodeRarityProbability(data: Buffer): GachaRarityProbability {
  const fields = decodeProtoFields(data);
  return {
    rarity: numberField(fields, 1, "card rarity"),
    partsPerTenMillionProbability: numberField(
      fields,
      2,
      "rarity probability parts per ten million",
    ),
    cardProbabilities: (fields.get(3) ?? [])
      .filter(isBuffer)
      .map(decodeCardProbability),
  };
}

function decodeCardProbability(data: Buffer): GachaCardProbability {
  const fields = decodeProtoFields(data);
  return {
    cardId: firstString(fields, 1) ?? "",
    partsPerTenMillionProbability: numberField(
      fields,
      2,
      "card probability parts per ten million",
    ),
    isRateUp: firstBool(fields, 3),
  };
}

function stringList(
  fields: Map<number, ProtoValue[]>,
  field: number,
): string[] {
  return (fields.get(field) ?? [])
    .filter(isBuffer)
    .map((value) => value.toString("utf8"));
}

function findMessage(
  fields: Map<number, ProtoValue[]>,
  field: number,
): Buffer | undefined {
  return fields.get(field)?.find(isBuffer);
}

function numberField(
  fields: Map<number, ProtoValue[]>,
  field: number,
  name: string,
): number {
  return toSafeNumber(firstUint(fields, field) ?? 0n, name);
}
