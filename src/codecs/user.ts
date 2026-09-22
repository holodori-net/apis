import { firstUint, requireString } from "../protobuf.js";
import {
  decodeProtoFields,
  encodeEmpty,
  isBuffer,
  toSafeNumber,
} from "./common.js";

const USER_DATA_CARDS_FIELD = 315_485_766;

export interface AccountCard {
  readonly cardId: string;
  readonly exp: bigint;
  readonly levelLimitBreakCount: number;
  readonly potentialUpgradeCount: number;
  readonly potentialUpgradePointQuantity: number;
  readonly acquiredTime: bigint;
}

export interface UserGetResponse {
  readonly cards: readonly AccountCard[];
}

export function encodeUserGetRequest(): Buffer {
  return encodeEmpty();
}

export function decodeUserGetResponse(data: Buffer): UserGetResponse {
  const responseFields = decodeProtoFields(data);
  const userData = responseFields.get(1)?.find(isBuffer);
  if (!userData) throw new Error("User/Get response has no user_data field");

  const userDataFields = decodeProtoFields(userData);
  return {
    cards: (userDataFields.get(USER_DATA_CARDS_FIELD) ?? [])
      .filter(isBuffer)
      .map(decodeAccountCard),
  };
}

function decodeAccountCard(data: Buffer): AccountCard {
  const fields = decodeProtoFields(data);
  return {
    cardId: requireString(fields, 2, "card ID"),
    exp: firstUint(fields, 3) ?? 0n,
    levelLimitBreakCount: toSafeNumber(
      firstUint(fields, 4) ?? 0n,
      "card level limit break count",
    ),
    potentialUpgradeCount: toSafeNumber(
      firstUint(fields, 5) ?? 0n,
      "card potential upgrade count",
    ),
    potentialUpgradePointQuantity: toSafeNumber(
      firstUint(fields, 6) ?? 0n,
      "card potential upgrade point quantity",
    ),
    acquiredTime: firstUint(fields, 7) ?? 0n,
  };
}

export { USER_DATA_CARDS_FIELD };
