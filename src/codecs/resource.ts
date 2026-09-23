import { firstString, firstUint } from "../protocol/protobuf.js";
import { decodeProtoFields, toSafeNumber } from "./common.js";

export interface CommonConsumption {
  readonly resourceType: number;
  readonly resourceId: string;
  readonly quantity: bigint;
}

export interface CommonReward {
  readonly resourceType: number;
  readonly resourceId: string;
  readonly quantity: bigint;
}

/** Decodes the game's common resource-consumption protobuf message. */
export function decodeCommonConsumption(data: Buffer): CommonConsumption {
  const fields = decodeProtoFields(data);
  return {
    resourceType: toSafeNumber(
      firstUint(fields, 1) ?? 0n,
      "consumption resource type",
    ),
    resourceId: firstString(fields, 2) ?? "",
    quantity: firstUint(fields, 3) ?? 0n,
  };
}

/** Decodes the game's common reward protobuf message. */
export function decodeCommonReward(data: Buffer): CommonReward {
  const fields = decodeProtoFields(data);
  return {
    resourceType: toSafeNumber(
      firstUint(fields, 1) ?? 0n,
      "reward resource type",
    ),
    resourceId: firstString(fields, 2) ?? "",
    quantity: firstUint(fields, 3) ?? 0n,
  };
}
