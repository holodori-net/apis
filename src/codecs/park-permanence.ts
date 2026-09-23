import {
  encodeBytesField,
  encodeStringField,
  encodeVarintField,
  firstBool,
  firstString,
} from "../protocol/protobuf.js";
import { decodeProtoFields, encodeMessage, isBuffer } from "./common.js";
import {
  type CommonConsumption,
  type CommonReward,
  decodeCommonConsumption,
  decodeCommonReward,
} from "./resource.js";

export type ParkPermanenceConsumption = CommonConsumption;
export type ParkPermanenceReward = CommonReward;

export interface ParkPermanenceListCharacterShopItemRequest {
  readonly actionNumber: number;
  readonly parkPermanenceId: string;
}

export interface ParkPermanenceCharacterShopItem {
  readonly parkCharacterShopItemId: string;
  readonly rewards: readonly ParkPermanenceReward[];
  readonly sdCostumeId: string;
  readonly assetId: string;
}

export interface ParkPermanenceCharacterShopItemWithCollectedInfo {
  readonly item?: ParkPermanenceCharacterShopItem;
  readonly isCollected: boolean;
}

export interface ParkPermanenceListCharacterShopItemResponse {
  readonly shopName: string;
  readonly consumption?: ParkPermanenceConsumption;
  readonly itemInfos: readonly ParkPermanenceCharacterShopItemWithCollectedInfo[];
  readonly pickedItems: readonly ParkPermanenceCharacterShopItem[];
}

export function encodeParkPermanenceListCharacterShopItemRequest(
  request: ParkPermanenceListCharacterShopItemRequest,
): Buffer {
  if (
    typeof request.parkPermanenceId !== "string" ||
    request.parkPermanenceId.length === 0
  ) {
    throw new RangeError("park permanence ID must not be empty");
  }
  if (!Number.isSafeInteger(request.actionNumber) || request.actionNumber < 1) {
    throw new RangeError("action number must be a positive integer");
  }
  return encodeMessage(
    encodeBytesField(
      1,
      encodeMessage(
        encodeStringField(1, request.parkPermanenceId),
        encodeVarintField(2, request.actionNumber),
      ),
    ),
  );
}

export function decodeParkPermanenceListCharacterShopItemResponse(
  data: Buffer,
): ParkPermanenceListCharacterShopItemResponse {
  const fields = decodeProtoFields(data);
  const consumption = fields.get(2)?.find(isBuffer);
  return {
    shopName: firstString(fields, 1) ?? "",
    ...(consumption === undefined
      ? {}
      : { consumption: decodeCommonConsumption(consumption) }),
    itemInfos: (fields.get(3) ?? [])
      .filter(isBuffer)
      .map(decodeCharacterShopItemWithCollectedInfo),
    pickedItems: (fields.get(4) ?? [])
      .filter(isBuffer)
      .map(decodeCharacterShopItem),
  };
}

function decodeCharacterShopItemWithCollectedInfo(
  data: Buffer,
): ParkPermanenceCharacterShopItemWithCollectedInfo {
  const fields = decodeProtoFields(data);
  const item = fields.get(1)?.find(isBuffer);
  return {
    ...(item === undefined ? {} : { item: decodeCharacterShopItem(item) }),
    isCollected: firstBool(fields, 2),
  };
}

function decodeCharacterShopItem(
  data: Buffer,
): ParkPermanenceCharacterShopItem {
  const fields = decodeProtoFields(data);
  return {
    parkCharacterShopItemId: firstString(fields, 1) ?? "",
    rewards: (fields.get(2) ?? []).filter(isBuffer).map(decodeCommonReward),
    sdCostumeId: firstString(fields, 3) ?? "",
    assetId: firstString(fields, 4) ?? "",
  };
}
