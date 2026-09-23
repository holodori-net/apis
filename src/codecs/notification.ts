import { firstBool, firstString } from "../protocol/protobuf.js";
import { decodeProtoFields, encodeEmpty, isBuffer } from "./common.js";

/** Account-specific notification flags and updated exchange booth groups. */
export interface NotificationListResponse {
  readonly isGachaUnread: boolean;
  readonly isNoticeUnread: boolean;
  readonly isFriendOfferReceived: boolean;
  readonly isFriendExists: boolean;
  readonly isMembershipUnread: boolean;
  readonly isShopItemUnread: boolean;
  readonly parkNotificationInfo?: ParkNotificationInfo;
}

export interface ParkNotificationInfo {
  readonly updatedExchangeBoothGroups: readonly UpdatedExchangeBoothGroup[];
}

export interface UpdatedExchangeBoothGroup {
  readonly groupId: string;
  readonly name: string;
}

export function encodeNotificationListRequest(): Buffer {
  return encodeEmpty();
}

export function decodeNotificationListResponse(
  data: Buffer,
): NotificationListResponse {
  const fields = decodeProtoFields(data);
  const parkInfo = fields.get(100)?.find(isBuffer);
  return {
    isGachaUnread: firstBool(fields, 1),
    isNoticeUnread: firstBool(fields, 2),
    isFriendOfferReceived: firstBool(fields, 3),
    isFriendExists: firstBool(fields, 4),
    isMembershipUnread: firstBool(fields, 5),
    isShopItemUnread: firstBool(fields, 6),
    ...(parkInfo === undefined
      ? {}
      : { parkNotificationInfo: decodeParkNotificationInfo(parkInfo) }),
  };
}

function decodeParkNotificationInfo(data: Buffer): ParkNotificationInfo {
  const fields = decodeProtoFields(data);
  return {
    updatedExchangeBoothGroups: (fields.get(1) ?? [])
      .filter(isBuffer)
      .map(decodeUpdatedExchangeBoothGroup),
  };
}

function decodeUpdatedExchangeBoothGroup(
  data: Buffer,
): UpdatedExchangeBoothGroup {
  const fields = decodeProtoFields(data);
  return {
    groupId: firstString(fields, 1) ?? "",
    name: firstString(fields, 2) ?? "",
  };
}
