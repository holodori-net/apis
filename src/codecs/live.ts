import {
  encodeBytesField,
  encodeStringField,
  encodeVarintField,
  firstString,
  firstUint,
  type ProtoValue,
  requireString,
} from "../protobuf.js";
import {
  decodeProtoFields,
  encodeMessage,
  isBuffer,
  requireNonEmpty,
  toSafeNumber,
} from "./common.js";

export interface LiveGetDeckCandidateCardParametersRequest {
  readonly characterId: string;
  readonly costumeId: string;
  readonly musicId?: string;
}

export interface LiveDeckPositionInput {
  readonly position: number;
  readonly cardId: string;
}

export interface LiveGetDraftDeckInfoRequest {
  readonly characterId: string;
  readonly costumeId: string;
  readonly deckPositions: readonly LiveDeckPositionInput[];
  readonly musicId?: string;
}

export interface LiveGetDeckRequest {
  readonly characterId: string;
  readonly number: number;
  readonly musicId?: string;
}

export interface LiveDeckCandidateCardParameterInfo {
  readonly cardId: string;
  readonly parameter: bigint;
  readonly performance: bigint;
  readonly technique: bigint;
  readonly sense: bigint;
}

export interface LiveGetDeckCandidateCardParametersResponse {
  readonly parameterInfos: readonly LiveDeckCandidateCardParameterInfo[];
}

export interface LiveDeckPosition {
  readonly position: number;
  readonly cardId: string;
  readonly liveDeckPower: bigint;
}

export interface LiveGetDraftDeckInfoResponse {
  readonly liveDeckPower: bigint;
  readonly deckPositions: readonly LiveDeckPosition[];
}

export interface LiveDeckPower {
  readonly liveDeckPower: bigint;
  readonly liveDeckPowerRankType: number;
  readonly liveDeckPowerRankPlusValue: number;
  readonly cardPotentialParameterEvaluationValue: bigint;
  readonly cardParameterUpByLiveLeaderSkill: bigint;
  readonly cardParameterUpByLivePassiveSkill: bigint;
  readonly cardParameterUpBySkillTree: bigint;
  readonly cardParameterUpByPosterCollect: bigint;
  readonly cardTrainingEvaluationValue: bigint;
}

export interface LiveDeckEvaluationScoreUpPermilUp {
  readonly scoreUpPermilUp: bigint;
  readonly scoreUpPermilUpRankType: number;
  readonly scoreUpPermilUpRankPlusValue: number;
  readonly scoreUpPermilUpByLiveActiveSkill: bigint;
  readonly scoreUpPermilUpByLiveLeaderSkill: bigint;
  readonly scoreUpPermilUpByLivePassiveSkill: bigint;
  readonly scoreUpPermilUpBySkillTree: bigint;
  readonly scoreUpPermilUpByLiveSpecialSkill: bigint;
}

export interface LiveDeckEvaluation {
  readonly liveDeckEvaluationValue: bigint;
  readonly liveDeckEvaluationRankType: number;
  readonly liveDeckEvaluationRankPlusValue: number;
  readonly liveDeckPower?: LiveDeckPower;
  readonly liveDeckEvaluationScoreUpPermilUp?: LiveDeckEvaluationScoreUpPermilUp;
}

export interface LiveActiveSkillLevel {
  readonly liveActiveSkillId: string;
  readonly level: number;
}

export interface LiveDeckInGameEffectPosition {
  readonly position: number;
  readonly cardId: string;
  readonly performance: bigint;
  readonly technique: bigint;
  readonly sense: bigint;
  readonly liveActiveSkillEffectUpPermilUp: number;
  readonly liveActiveSkillActivationProbabilityUpPermilUp: number;
  readonly liveActiveSkillCoolTimeShortenPermilUp: number;
}

export interface LiveDeckInGameEffect {
  readonly lifeUp: number;
  readonly liveLeaderActiveSkillLevels: readonly LiveActiveSkillLevel[];
  readonly liveScoreBonusPermilUpBySkillTree: number;
  readonly liveDeckPositions: readonly LiveDeckInGameEffectPosition[];
}

export interface LiveGetDeckResponse {
  readonly deckPositions: readonly LiveDeckPosition[];
  readonly liveDeckEvaluation?: LiveDeckEvaluation;
  readonly liveDeckInGameEffect?: LiveDeckInGameEffect;
}

export function encodeLiveGetDeckCandidateCardParametersRequest(
  request: LiveGetDeckCandidateCardParametersRequest,
): Buffer {
  return encodeMessage(
    encodeStringField(1, requireNonEmpty(request.characterId, "character ID")),
    encodeStringField(2, requireNonEmpty(request.costumeId, "costume ID")),
    ...encodeOptionalMusicId(request.musicId),
  );
}

export function encodeLiveGetDraftDeckInfoRequest(
  request: LiveGetDraftDeckInfoRequest,
): Buffer {
  if (request.deckPositions.length > 5)
    throw new RangeError("deck positions must contain at most five entries");
  return encodeMessage(
    encodeStringField(1, requireNonEmpty(request.characterId, "character ID")),
    encodeStringField(2, requireNonEmpty(request.costumeId, "costume ID")),
    ...request.deckPositions.map((position) =>
      encodeBytesField(3, encodeLiveDeckPositionInput(position)),
    ),
    ...encodeOptionalMusicId(request.musicId, 4),
  );
}

export function encodeLiveGetDeckRequest(request: LiveGetDeckRequest): Buffer {
  if (!Number.isInteger(request.number) || request.number < 1)
    throw new RangeError("deck number must be a positive integer");
  return encodeMessage(
    encodeStringField(1, requireNonEmpty(request.characterId, "character ID")),
    encodeVarintField(2, request.number),
    ...encodeOptionalMusicId(request.musicId),
  );
}

export function decodeLiveGetDeckCandidateCardParametersResponse(
  data: Buffer,
): LiveGetDeckCandidateCardParametersResponse {
  const fields = decodeProtoFields(data);
  return {
    parameterInfos: (fields.get(1) ?? [])
      .filter(isBuffer)
      .map(decodeLiveDeckCandidateCardParameterInfo),
  };
}

export function decodeLiveGetDraftDeckInfoResponse(
  data: Buffer,
): LiveGetDraftDeckInfoResponse {
  const fields = decodeProtoFields(data);
  return {
    liveDeckPower: firstUint(fields, 1) ?? 0n,
    deckPositions: (fields.get(2) ?? [])
      .filter(isBuffer)
      .map(decodeLiveDeckPosition),
  };
}

export function decodeLiveGetDeckResponse(data: Buffer): LiveGetDeckResponse {
  const fields = decodeProtoFields(data);
  const liveDeckEvaluation = firstMessage(fields, 2);
  const liveDeckInGameEffect = firstMessage(fields, 3);
  return {
    deckPositions: (fields.get(1) ?? [])
      .filter(isBuffer)
      .map(decodeLiveDeckPosition),
    ...(liveDeckEvaluation === undefined
      ? {}
      : { liveDeckEvaluation: decodeLiveDeckEvaluation(liveDeckEvaluation) }),
    ...(liveDeckInGameEffect === undefined
      ? {}
      : {
          liveDeckInGameEffect:
            decodeLiveDeckInGameEffect(liveDeckInGameEffect),
        }),
  };
}

function encodeLiveDeckPositionInput(position: LiveDeckPositionInput): Buffer {
  if (
    !Number.isInteger(position.position) ||
    position.position < 1 ||
    position.position > 5
  )
    throw new RangeError("deck position must be an integer from one to five");
  return encodeMessage(
    encodeVarintField(1, position.position),
    encodeStringField(2, requireNonEmpty(position.cardId, "card ID")),
  );
}

function encodeOptionalMusicId(
  musicId: string | undefined,
  field = 3,
): readonly Buffer[] {
  return musicId === undefined || musicId.length === 0
    ? []
    : [encodeStringField(field, musicId)];
}

function decodeLiveDeckCandidateCardParameterInfo(
  data: Buffer,
): LiveDeckCandidateCardParameterInfo {
  const fields = decodeProtoFields(data);
  return {
    cardId: requireString(fields, 1, "card ID"),
    parameter: firstUint(fields, 2) ?? 0n,
    performance: firstUint(fields, 3) ?? 0n,
    technique: firstUint(fields, 4) ?? 0n,
    sense: firstUint(fields, 5) ?? 0n,
  };
}

function decodeLiveDeckPosition(data: Buffer): LiveDeckPosition {
  const fields = decodeProtoFields(data);
  return {
    position: toSafeNumber(firstUint(fields, 1) ?? 0n, "deck position"),
    cardId: firstString(fields, 2) ?? "",
    liveDeckPower: firstUint(fields, 3) ?? 0n,
  };
}

function decodeLiveDeckEvaluation(data: Buffer): LiveDeckEvaluation {
  const fields = decodeProtoFields(data);
  const liveDeckPower = firstMessage(fields, 4);
  const scoreUpPermilUp = firstMessage(fields, 5);
  return {
    liveDeckEvaluationValue: firstUint(fields, 1) ?? 0n,
    liveDeckEvaluationRankType: toSafeNumber(
      firstUint(fields, 2) ?? 0n,
      "live deck evaluation rank type",
    ),
    liveDeckEvaluationRankPlusValue: toSafeNumber(
      firstUint(fields, 3) ?? 0n,
      "live deck evaluation rank plus value",
    ),
    ...(liveDeckPower === undefined
      ? {}
      : { liveDeckPower: decodeLiveDeckPower(liveDeckPower) }),
    ...(scoreUpPermilUp === undefined
      ? {}
      : {
          liveDeckEvaluationScoreUpPermilUp:
            decodeLiveDeckEvaluationScoreUpPermilUp(scoreUpPermilUp),
        }),
  };
}

function decodeLiveDeckPower(data: Buffer): LiveDeckPower {
  const fields = decodeProtoFields(data);
  return {
    liveDeckPower: firstUint(fields, 1) ?? 0n,
    liveDeckPowerRankType: toSafeNumber(
      firstUint(fields, 2) ?? 0n,
      "live deck power rank type",
    ),
    liveDeckPowerRankPlusValue: toSafeNumber(
      firstUint(fields, 3) ?? 0n,
      "live deck power rank plus value",
    ),
    cardPotentialParameterEvaluationValue: firstUint(fields, 4) ?? 0n,
    cardParameterUpByLiveLeaderSkill: firstUint(fields, 5) ?? 0n,
    cardParameterUpByLivePassiveSkill: firstUint(fields, 6) ?? 0n,
    cardParameterUpBySkillTree: firstUint(fields, 7) ?? 0n,
    cardParameterUpByPosterCollect: firstUint(fields, 8) ?? 0n,
    cardTrainingEvaluationValue: firstUint(fields, 9) ?? 0n,
  };
}

function decodeLiveDeckEvaluationScoreUpPermilUp(
  data: Buffer,
): LiveDeckEvaluationScoreUpPermilUp {
  const fields = decodeProtoFields(data);
  return {
    scoreUpPermilUp: firstUint(fields, 1) ?? 0n,
    scoreUpPermilUpRankType: toSafeNumber(
      firstUint(fields, 2) ?? 0n,
      "score up permil rank type",
    ),
    scoreUpPermilUpRankPlusValue: toSafeNumber(
      firstUint(fields, 3) ?? 0n,
      "score up permil rank plus value",
    ),
    scoreUpPermilUpByLiveActiveSkill: firstUint(fields, 4) ?? 0n,
    scoreUpPermilUpByLiveLeaderSkill: firstUint(fields, 5) ?? 0n,
    scoreUpPermilUpByLivePassiveSkill: firstUint(fields, 6) ?? 0n,
    scoreUpPermilUpBySkillTree: firstUint(fields, 7) ?? 0n,
    scoreUpPermilUpByLiveSpecialSkill: firstUint(fields, 8) ?? 0n,
  };
}

function decodeLiveDeckInGameEffect(data: Buffer): LiveDeckInGameEffect {
  const fields = decodeProtoFields(data);
  return {
    lifeUp: toSafeNumber(firstUint(fields, 1) ?? 0n, "life up"),
    liveLeaderActiveSkillLevels: (fields.get(2) ?? [])
      .filter(isBuffer)
      .map(decodeLiveActiveSkillLevel),
    liveScoreBonusPermilUpBySkillTree: firstFloat(fields, 3),
    liveDeckPositions: (fields.get(100) ?? [])
      .filter(isBuffer)
      .map(decodeLiveDeckInGameEffectPosition),
  };
}

function decodeLiveActiveSkillLevel(data: Buffer): LiveActiveSkillLevel {
  const fields = decodeProtoFields(data);
  return {
    liveActiveSkillId: firstString(fields, 1) ?? "",
    level: toSafeNumber(firstUint(fields, 2) ?? 0n, "active skill level"),
  };
}

function decodeLiveDeckInGameEffectPosition(
  data: Buffer,
): LiveDeckInGameEffectPosition {
  const fields = decodeProtoFields(data);
  return {
    position: toSafeNumber(firstUint(fields, 1) ?? 0n, "effect deck position"),
    cardId: firstString(fields, 2) ?? "",
    performance: firstUint(fields, 3) ?? 0n,
    technique: firstUint(fields, 4) ?? 0n,
    sense: firstUint(fields, 5) ?? 0n,
    liveActiveSkillEffectUpPermilUp: firstFloat(fields, 6),
    liveActiveSkillActivationProbabilityUpPermilUp: firstFloat(fields, 7),
    liveActiveSkillCoolTimeShortenPermilUp: firstFloat(fields, 8),
  };
}

function firstMessage(
  fields: Map<number, ProtoValue[]>,
  field: number,
): Buffer | undefined {
  const value = fields.get(field)?.[0];
  return value !== undefined && isBuffer(value) ? value : undefined;
}

function firstFloat(fields: Map<number, ProtoValue[]>, field: number): number {
  const value = fields.get(field)?.[0];
  if (value === undefined || !isBuffer(value)) return 0;
  if (value.length !== 4)
    throw new Error(`protobuf float field ${field} is not fixed32`);
  return value.readFloatLE(0);
}
