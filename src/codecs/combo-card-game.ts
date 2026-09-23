import { firstBytes, firstInt32, firstInt64 } from "../protobuf.js";
import {
  decodeProtoFields,
  decodeRepeatedMessages,
  encodeMessage,
  encodeStringField,
} from "./common.js";
import {
  decodeProfileBasicUserInfo,
  type ProfileBasicUserInfo,
} from "./profile.js";

/** Request for Combo Card Game user statistics. */
export interface ComboCardGameListUserInfoRequest {
  readonly publicUserIds: readonly string[];
  readonly privateRoomId?: string;
}

/** Public Combo Card Game statistics for one user. */
export interface ComboCardGameUserInfo {
  readonly basicUserInfo?: ProfileBasicUserInfo;
  readonly comboCardGameAverageRankPercent: number;
  readonly comboCardGameChipDiffTotalQuantity: bigint;
}

/** Response containing Combo Card Game statistics for requested users. */
export interface ComboCardGameListUserInfoResponse {
  readonly comboCardGameUserInfos: readonly ComboCardGameUserInfo[];
}

/** Encodes a request for Combo Card Game user statistics. */
export function encodeComboCardGameListUserInfoRequest(
  request: ComboCardGameListUserInfoRequest,
): Buffer {
  if (request.publicUserIds.length === 0) {
    throw new RangeError(
      "publicUserIds must contain at least one public user ID",
    );
  }
  const fields = request.publicUserIds.map((publicUserId) => {
    if (publicUserId.length === 0) {
      throw new RangeError(
        "publicUserIds must not contain empty public user IDs",
      );
    }
    return encodeStringField(1, publicUserId);
  });
  if (request.privateRoomId !== undefined) {
    fields.push(encodeStringField(2, request.privateRoomId));
  }
  return encodeMessage(...fields);
}

/** Decodes Combo Card Game user statistics. */
export function decodeComboCardGameListUserInfoResponse(
  data: Buffer,
): ComboCardGameListUserInfoResponse {
  const fields = decodeProtoFields(data);
  return {
    comboCardGameUserInfos: decodeRepeatedMessages(
      fields,
      1,
      decodeComboCardGameUserInfo,
    ),
  };
}

function decodeComboCardGameUserInfo(data: Buffer): ComboCardGameUserInfo {
  const fields = decodeProtoFields(data);
  const basicUserInfo = firstBytes(fields, 1);
  return {
    ...(basicUserInfo === undefined
      ? {}
      : { basicUserInfo: decodeProfileBasicUserInfo(basicUserInfo) }),
    comboCardGameAverageRankPercent: firstInt32(fields, 2) ?? 0,
    comboCardGameChipDiffTotalQuantity: firstInt64(fields, 3) ?? 0n,
  };
}
