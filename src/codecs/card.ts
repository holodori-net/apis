import {
  encodeStringField,
  firstUint,
  type ProtoValue,
  requireString,
} from "../protobuf.js";
import {
  decodeProtoFields,
  encodeEmpty,
  encodeMessage,
  isBuffer,
  requireNonEmpty,
  toSafeNumber,
} from "./common.js";

export interface CardGetParameterResponse {
  readonly parameter: bigint;
  readonly performance: bigint;
  readonly technique: bigint;
  readonly sense: bigint;
  readonly skillTreeEffect?: CardSkillTreeEffect;
}

export interface CardSkillTreeEffect {
  readonly performanceUp: number;
  readonly performanceUpPermilUp: number;
  readonly techniqueUp: number;
  readonly techniqueUpPermilUp: number;
  readonly senseUp: number;
  readonly senseUpPermilUp: number;
}

export interface CardGetParametersResponse {
  readonly parameterInfos: readonly CardParameterInfo[];
  readonly liveDeckPowerPermyriadUpByCardLevelUp: number;
}

export interface CardParameterInfo {
  readonly cardId: string;
  readonly parameter: bigint;
  readonly performance: bigint;
  readonly technique: bigint;
  readonly sense: bigint;
}

export function encodeCardGetParameterRequest(cardId: string): Buffer {
  return encodeMessage(
    encodeStringField(1, requireNonEmpty(cardId, "card ID")),
  );
}

export function encodeCardGetParametersRequest(): Buffer {
  return encodeEmpty();
}

export function decodeCardGetParameterResponse(
  data: Buffer,
): CardGetParameterResponse {
  const fields = decodeProtoFields(data);
  const skillTreeEffect = fields.get(5)?.find(isBuffer);
  return {
    parameter: firstUint(fields, 1) ?? 0n,
    performance: firstUint(fields, 2) ?? 0n,
    technique: firstUint(fields, 3) ?? 0n,
    sense: firstUint(fields, 4) ?? 0n,
    ...(skillTreeEffect === undefined
      ? {}
      : { skillTreeEffect: decodeSkillTreeEffect(skillTreeEffect) }),
  };
}

export function decodeCardGetParametersResponse(
  data: Buffer,
): CardGetParametersResponse {
  const fields = decodeProtoFields(data);
  return {
    parameterInfos: (fields.get(1) ?? [])
      .filter(isBuffer)
      .map(decodeParameterInfo),
    liveDeckPowerPermyriadUpByCardLevelUp: toSafeNumber(
      firstUint(fields, 2) ?? 0n,
      "live deck power permyriad increase by card level up",
    ),
  };
}

function decodeSkillTreeEffect(data: Buffer): CardSkillTreeEffect {
  const fields = decodeProtoFields(data);
  return {
    performanceUp: toSafeNumber(
      firstUint(fields, 1) ?? 0n,
      "skill tree performance increase",
    ),
    performanceUpPermilUp: firstFloat32(fields, 2),
    techniqueUp: toSafeNumber(
      firstUint(fields, 3) ?? 0n,
      "skill tree technique increase",
    ),
    techniqueUpPermilUp: firstFloat32(fields, 4),
    senseUp: toSafeNumber(
      firstUint(fields, 5) ?? 0n,
      "skill tree sense increase",
    ),
    senseUpPermilUp: firstFloat32(fields, 6),
  };
}

function decodeParameterInfo(data: Buffer): CardParameterInfo {
  const fields = decodeProtoFields(data);
  return {
    cardId: requireString(fields, 1, "card ID"),
    parameter: firstUint(fields, 2) ?? 0n,
    performance: firstUint(fields, 3) ?? 0n,
    technique: firstUint(fields, 4) ?? 0n,
    sense: firstUint(fields, 5) ?? 0n,
  };
}

function firstFloat32(
  fields: Map<number, ProtoValue[]>,
  field: number,
): number {
  const value = fields.get(field)?.[0];
  if (value === undefined) return 0;
  if (!Buffer.isBuffer(value) || value.length !== 4) {
    throw new Error(`protobuf field ${field} is not a fixed32 float`);
  }
  return value.readFloatLE(0);
}
